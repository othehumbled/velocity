// velocity ai chat — shared by velocity.html and velocity-public.html.
// loaded as a plain script before the main inline script, so its globals
// (aiHTML, wireAI, ...) are available to renderFrame.
// keyless model runs on pollinations; the openrouter group needs a free key.
var AI_KEYLESS=[{id:"openai-fast",label:"gpt-oss 20b (openai)"}];
var AI_OR=[["google/gemma-4-31b-it:free","gemma 4 31b (google)"],["google/gemma-4-26b-a4b-it:free","gemma 4 26b (google)"],["qwen/qwen3.8-27b:free","qwen 3.8 27b (alibaba)"],["nvidia/nemotron-3-super-120b-a12b:free","nemotron 3 (nvidia)"],["inclusionai/ling-3.0-flash-sante:free","ling 3.0 flash"],["thinkingmachines/inkling-small:free","inkling small"],["dots-studio/dots-3-note-preview:free","dots 3 note"],["cohere/north-mini-code:free","north mini (cohere)"],["poolside/laguna-s-2.1:free","laguna s (poolside)"]];
var AI_LIMIT=20,AI_WINDOW=3600000; // 20 messages per rolling hour, per browser
function getAIModel(){try{return localStorage.getItem("vel_ai_model")||"openai-fast";}catch(e){return"openai-fast";}}
function setAIModel(v){try{localStorage.setItem("vel_ai_model",v);}catch(e){}}
function getAIKey(){try{return localStorage.getItem("vel_ai_key")||"";}catch(e){return"";}}
function setAIKey(v){try{v?localStorage.setItem("vel_ai_key",v):localStorage.removeItem("vel_ai_key");}catch(e){}}
function aiUsage(){try{var now=Date.now();var a=JSON.parse(localStorage.getItem("vel_ai_usage")||"[]").filter(function(t){return now-t<AI_WINDOW;});localStorage.setItem("vel_ai_usage",JSON.stringify(a));return a;}catch(e){return[];}}
function aiLeft(){return Math.max(0,AI_LIMIT-aiUsage().length);}
function aiQuotaText(){return aiLeft()+" left this hour";}
function escAI(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function aiTabMsgs(){var at=activeTab();if(!at.aiMsgs)at.aiMsgs=[];return at.aiMsgs;}
function aiMsgsHTML(msgs){
  if(!msgs.length)return'<div style="margin:auto;text-align:center;color:var(--muted);font-size:13px;line-height:1.7;padding:0 20px;">pick a model and say hi.<br>the default works with no key at all.<br>the openrouter group unlocks more models with a free key from openrouter.ai — paste it in the key field.</div>';
  return msgs.map(function(m){var cls=m.role==="user"?"ai-msg user":(m.error?"ai-msg err":"ai-msg bot");return'<div class="'+cls+'">'+escAI(m.content)+(m.pending?'<span class="ai-cursor"></span>':'')+'</div>';}).join("");
}
function aiHTML(){
  var m=getAIModel();
  var opts='<optgroup label="free - no key needed">'+AI_KEYLESS.map(function(x){return'<option value="'+x.id+'"'+(m===x.id?" selected":"")+'>'+x.label+'</option>';}).join("")+'</optgroup>';
  opts+='<optgroup label="openrouter - needs a free key">'+AI_OR.map(function(x){return'<option value="'+x[0]+'"'+(m===x[0]?" selected":"")+'>'+x[1]+'</option>';}).join("")+'</optgroup>';
  return '<div class="settings-inner">'+
    '<div class="set-head"><h2>ai chat</h2><p>free ai models. streaming replies, no sign-up.</p></div>'+
    '<div class="ai-top"><select class="select-styled" id="aiModel">'+opts+'</select></div>'+
    '<div><label class="field-label">openrouter key (optional - unlocks the group above)</label><input class="text-input" id="aiKey" type="password" placeholder="sk-or-..." autocomplete="off" value="'+escAI(getAIKey())+'"/></div>'+
    '<div class="ai-chat" id="aiMsgs">'+aiMsgsHTML(aiTabMsgs())+'</div>'+
    '<div class="ai-inrow"><textarea class="text-input" id="aiInput" rows="2" placeholder="ask anything... (enter to send)"></textarea><button class="eng-btn active" id="aiSend">send</button><button class="bg-preset" id="aiClear">clear</button><span id="aiQuota" style="color:var(--muted);font-size:11px;white-space:nowrap;padding-bottom:8px;">'+aiQuotaText()+'</span></div>'+
    '</div>';
}
function wireAI(){
  var at=activeTab();if(!at)return;
  var sel=document.getElementById("aiModel");if(sel)sel.onchange=function(){setAIModel(sel.value);};
  var key=document.getElementById("aiKey");if(key)key.onchange=function(){setAIKey(key.value.trim());};
  var inp=document.getElementById("aiInput");
  if(inp){inp.onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();aiSend();}};setTimeout(function(){try{inp.focus();}catch(e){}},0);}
  var send=document.getElementById("aiSend");if(send)send.onclick=aiSend;
  var clear=document.getElementById("aiClear");if(clear)clear.onclick=function(){at.aiMsgs=[];rerenderAI();};
}
function aiSyncQuota(){var q=document.getElementById("aiQuota");if(q)q.textContent=aiQuotaText();}
function rerenderAI(){var at=activeTab();if(!at||at.kind!=="ai")return;var box=document.getElementById("aiMsgs");if(!box)return;box.innerHTML=aiMsgsHTML(aiTabMsgs());box.scrollTop=box.scrollHeight;aiSyncQuota();}
var aiBusy=false;
function aiSend(){
  if(aiBusy)return;
  var at=activeTab();if(!at||at.kind!=="ai")return;
  var inp=document.getElementById("aiInput");if(!inp)return;
  var q=inp.value.trim();if(!q)return;
  var msgs=aiTabMsgs(),model=getAIModel(),key=getAIKey();
  if(aiLeft()<=0){
    var used=aiUsage();
    var wait=Math.ceil((AI_WINDOW-(Date.now()-used[0]))/60000);
    msgs.push({role:"assistant",content:"rate limit reached (20 messages per hour) - this keeps the free usage from running out. try again in about "+wait+" min.",error:true});
    rerenderAI();return;
  }
  if(model!=="openai-fast"&&!key){msgs.push({role:"assistant",content:"that model needs a free openrouter key. get one at openrouter.ai/settings/keys (create an account, it's free) and paste it in the key field above. until then, the default model works with no key.",error:true});rerenderAI();return;}
  inp.value="";
  msgs.push({role:"user",content:q});
  var reply={role:"assistant",content:"",pending:true};
  msgs.push(reply);
  rerenderAI();
  aiBusy=true;
  try{var u=aiUsage();u.push(Date.now());localStorage.setItem("vel_ai_usage",JSON.stringify(u));}catch(e){}
  var history=msgs.filter(function(m){return m!==reply&&!m.error;}).map(function(m){return{role:m.role,content:m.content};}).slice(-16);
  var url,headers,body;
  if(model==="openai-fast"){url="https://text.pollinations.ai/openai";headers={"Content-Type":"application/json"};body={model:model,messages:history,stream:true};}
  else{url="https://openrouter.ai/api/v1/chat/completions";headers={"Content-Type":"application/json","Authorization":"Bearer "+key,"HTTP-Referer":location.origin,"X-Title":"Velocity"};body={model:model,messages:history,stream:true};}
  function paint(){var box=document.getElementById("aiMsgs");if(!box)return;var last=box.lastElementChild;if(last)last.innerHTML=escAI(reply.content)+'<span class="ai-cursor"></span>';box.scrollTop=box.scrollHeight;}
  fetch(url,{method:"POST",headers:headers,body:JSON.stringify(body)}).then(function(res){
    if(!res.ok||!res.body)return res.text().then(function(t){throw new Error("http "+res.status+(t?" - "+String(t).slice(0,180):""));});
    var reader=res.body.getReader(),dec=new TextDecoder(),buf="";
    function pump(){
      return reader.read().then(function(r){
        if(r.done)return;
        buf+=dec.decode(r.value,{stream:true});
        var parts=buf.split("\n");buf=parts.pop();
        parts.forEach(function(line){
          line=line.trim();if(line.slice(0,5)!=="data:")return;
          var d=line.slice(5).trim();if(d==="[DONE]")return;
          try{var j=JSON.parse(d);var ch=j.choices&&j.choices[0];var delta=ch&&ch.delta;if(delta&&typeof delta.content==="string"&&delta.content)reply.content+=delta.content;}catch(e){}
        });
        paint();
        return pump();
      });
    }
    return pump();
  }).catch(function(err){
    reply.content=reply.content||("error: "+(err&&err.message||"request failed"));
    if(!reply.content.length||reply.content.slice(0,6)==="error:")reply.error=true;
  }).then(function(){
    aiBusy=false;
    delete reply.pending;
    if(!reply.content)reply.content="(empty response - try again)";
    rerenderAI();
  });
}
