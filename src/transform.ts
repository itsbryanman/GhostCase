import { createHash, randomUUID } from "node:crypto";
import { normalize } from "node:path";
import type { FileInput, Format, Manifest, Policy, Rule, TransformRecord } from "./types.js";

const reserved = ["example.com", "example.org", "example.net"];
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const detectFormat = (name: string): Format => {
  const lower = name.toLowerCase();
  if ([".pdf", ".zip", ".gz", ".tar", ".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => lower.endsWith(ext))) {
    throw new Error(`${name}: unsupported input format`);
  }
  return lower.endsWith(".json") ? "json" : lower.endsWith(".csv") ? "csv" : "text";
};
function safeName(name: string) { if (!name || name.includes("/") || name.includes("\\") || normalize(name) !== name || name === "." || name === "..") throw new Error("Unsafe filename"); return name; }
function replacement(rule: Rule, original: string, map: Map<string,string>): string {
  const key = `${rule.entity || rule.id}\u0000${original}`;
  if (map.has(key)) return map.get(key)!;
  let value: string;
  if (rule.action === "replace") { if (rule.value === undefined) throw new Error(`Rule ${rule.id} needs value`); value = rule.value; }
  else if (rule.action === "fictional_email") { value = `person-${map.size + 1}@${reserved[map.size % reserved.length]}`; }
  else if (rule.action === "fictional_id") value = `ghost-${String(map.size + 1).padStart(4,"0")}`;
  else throw new Error("remove has no replacement");
  if (rule.preserve?.length) { if (value.length > original.length) throw new Error(`Rule ${rule.id} cannot preserve length: replacement is longer`); value = value + "x".repeat(original.length - value.length); }
  if (rule.preserve?.normalization) value = value.normalize(rule.preserve.normalization);
  for (const [otherKey, otherValue] of map) if (otherKey !== key && otherValue === value && !rule.entity) throw new Error(`Replacement collision in rule ${rule.id}; use a shared entity namespace or explicit distinct value`);
  map.set(key, value); return value;
}
function pointerParts(pointer:string) { if (!pointer.startsWith("/")) throw new Error(`JSON Pointer must start with /: ${pointer}`); return pointer.slice(1).split("/").map(x=>x.replace(/~1/g,"/").replace(/~0/g,"~")); }
function applyPointer(root: unknown, pointer:string, rule:Rule, file:string, map:Map<string,string>, record:TransformRecord) {
  const parts=pointerParts(pointer); const walk=(obj:any, i:number):void=> { if (i===parts.length-1) { const k=parts[i]; if (k === "*") { if (!Array.isArray(obj)) throw new Error(`Wildcard in ${rule.id} requires array`); obj.forEach((_:any,n:number)=>applyLeaf(obj,String(n))); } else applyLeaf(obj,k); return; } const k=parts[i]; if(k==="*") { if(!Array.isArray(obj)) throw new Error(`Wildcard in ${rule.id} requires array`); obj.forEach(v=>walk(v,i+1)); } else { if(obj?.[k]===undefined) return; walk(obj[k],i+1); } };
  const applyLeaf=(obj:any,k:string)=>{ if(!(k in obj)) return; const old=obj[k]; if(rule.action==="remove") { delete obj[k]; record.count++; return; } if(typeof old!=="string" && typeof old!=="number") throw new Error(`Rule ${rule.id} targets non scalar JSON value`); obj[k]=typeof old === "number" ? Number(replacement(rule,String(old),map)) : replacement(rule,old,map); if(typeof old === "number" && Number.isNaN(obj[k])) throw new Error(`Rule ${rule.id} cannot make numeric JSON value nonnumeric`); record.count++; };
  walk(root,0);
}
function parseCsv(input:string, delimiter:string): string[][] { const rows:string[][]=[]; let row:string[]=[], cell="", quoted=false; for(let i=0;i<input.length;i++){const c=input[i]; if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===delimiter){row.push(cell);cell="";}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell="";}else if(c!=='\r')cell+=c;} if(quoted)throw new Error("Malformed CSV: unclosed quote"); if(cell||row.length){row.push(cell);rows.push(row);} if(!rows.length) throw new Error("Empty CSV"); const width=rows[0].length;if(rows.some(r=>r.length!==width))throw new Error("Ambiguous CSV: uneven columns");return rows; }
function csvOut(rows:string[][],d:string){return rows.map(r=>r.map(x=>/["\n\r]/.test(x)||x.includes(d)?`"${x.replaceAll('"','""')}"`:x).join(d)).join("\n")+"\n";}
export function transform(files: FileInput[], policy: Policy) { if(policy.version!==1) throw new Error("Unsupported policy version"); const seen=new Set<string>(); for(const r of policy.rules){if(seen.has(r.id))throw new Error(`Duplicate rule id ${r.id}`);seen.add(r.id); if(r.action==="remove" && r.preserve)throw new Error(`Rule ${r.id} conflicts: remove cannot preserve properties`);}
 const map=new Map<string,string>(), records:TransformRecord[]=[], warnings:string[]=[], outputs:FileInput[]=[];
 for(const source of files){safeName(source.name);const format=source.format||detectFormat(source.name);let content=source.content;if(format==="json"){try{JSON.parse(content);}catch{throw new Error(`${source.name}: invalid JSON`)}}for(const rule of policy.rules){if(rule.kind!==format && !(format==="text"&&rule.kind==="regex"))continue; const rec={ruleId:rule.id,file:source.name,count:0,preserved:[],warnings:[]} as TransformRecord;if(rule.preserve?.length)rec.preserved.push("string length");if(rule.preserve?.normalization)rec.preserved.push(`Unicode ${rule.preserve.normalization}`);
  if(format==="json"&&rule.kind==="json"){let obj;try{obj=JSON.parse(content);}catch{throw new Error(`${source.name}: invalid JSON`)}applyPointer(obj,rule.selector,rule,source.name,map,rec);content=JSON.stringify(obj,null,2)+"\n";}
  if(format==="csv"&&rule.kind==="csv"){const config=policy.csv?.[source.name];if(!config)throw new Error(`${source.name}: CSV requires explicit delimiter and header policy`);if(!config.header)throw new Error(`${source.name}: CSV column selectors require header:true`);const rows=parseCsv(content,config.delimiter);const col=rows[0].indexOf(rule.selector);if(col<0)throw new Error(`${source.name}: no CSV column ${rule.selector}`);for(const row of rows.slice(1)){if(rule.action==="remove")row[col]="";else row[col]=replacement(rule,row[col],map);rec.count++;}content=csvOut(rows,config.delimiter);}
  if(format==="text"&&rule.kind==="regex"){let re:RegExp;try{re=new RegExp(rule.selector,"gu");}catch{throw new Error(`Rule ${rule.id} invalid regex`)}content=content.replace(re,(match,...args)=>{const groups=args.at(-1) as Record<string,string>|undefined; if(!groups||Object.keys(groups).length!==1)throw new Error(`Rule ${rule.id} must have exactly one named capture`);const [key,val]=Object.entries(groups)[0];if(val===undefined)return match;const next=rule.action==="remove"?"":replacement(rule,val,map);rec.count++;return match.replace(val,next);});}
  if(rec.count)records.push(rec);
 } outputs.push({name:source.name,content,format}); }
 const entityStats = new Map<string,{replacements:number,occurrences:number}>(); for(const [k] of map){const entity=k.split("\0")[0];const s=entityStats.get(entity)||{replacements:0,occurrences:0};s.replacements++;entityStats.set(entity,s);} for(const r of records){const rule=policy.rules.find(x=>x.id===r.ruleId)!;if(rule.entity){const s=entityStats.get(rule.entity)||{replacements:0,occurrences:0};s.occurrences+=r.count;entityStats.set(rule.entity,s);}}
 const manifest:Manifest={version:1,createdAt:new Date().toISOString(),files:outputs.map(f=>({name:f.name,format:f.format||detectFormat(f.name),sha256:sha(f.content),bytes:Buffer.byteLength(f.content)})),transformations:records,relationships:[...entityStats].map(([entity,s])=>({entity,...s})),warnings,unsupported:["No claim of complete anonymization; preserved structure and relationships may still identify people."],privacyReview:"REQUIRED",reproduction:{status:"NOT_RUN"}};return {outputs,manifest,mapping:Object.fromEntries(map)}; }
