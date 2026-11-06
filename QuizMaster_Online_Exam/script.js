const questions = [
  {q:"Which language is used to structure a web page?",o:["CSS","HTML","Java","Python"]},
  {q:"Which part of a computer is known as its brain?",o:["Monitor","Keyboard","CPU","Mouse"]},
  {q:"Which device is used to connect a computer to a network?",o:["Router","Printer","Scanner","Speaker"]},
  {q:"What does RAM stand for?",o:["Read Access Memory","Random Access Memory","Run Active Memory","Remote Access Machine"]},
  {q:"Which of these is an operating system?",o:["Google Chrome","Linux","HTML","Oracle"]},
  {q:"Which symbol is commonly used for a Java statement terminator?",o:[".","; ",":","/"]},
  {q:"Which protocol is used to browse websites securely?",o:["FTP","HTTP","HTTPS","SMTP"]},
  {q:"Which data structure follows FIFO order?",o:["Stack","Queue","Tree","Graph"]},
  {q:"Which unit is commonly used to measure processor clock speed?",o:["Hertz","Pixel","Byte","Litre"]},
  {q:"Which of these is a database management system?",o:["MySQL","CSS","Windows Explorer","PowerPoint"]}
];
// The answer key is checked by the Java server, not by the browser.
let studentName="", studentId="", current=0, remaining=900, interval=null, submitted=false;
let answers=Array(questions.length).fill(null), review=Array(questions.length).fill(false);
const $=id=>document.getElementById(id);
function show(id){["loginPage","instructionsPage","examPage","resultPage"].forEach(x=>$(x).classList.toggle("hidden",x!==id));}
$("loginForm").addEventListener("submit",e=>{e.preventDefault();studentName=$("studentName").value.trim();studentId=$("studentId").value.trim();if(studentName&&studentId)show("instructionsPage");});
$("startBtn").addEventListener("click",()=>{show("examPage");$("studentWelcome").textContent=`Student: ${studentName} · ID: ${studentId}`;render();updateTimer();interval=setInterval(()=>{remaining--;updateTimer();if(remaining<=0)finishExam();},1000);});
function render(){
 const q=questions[current];$("questionCount").textContent=`QUESTION ${current+1} OF ${questions.length}`;$("questionText").textContent=q.q;
 $("answeredCount").textContent=`${answers.filter(x=>x!==null).length} answered`;$("progressBar").style.width=`${(answers.filter(x=>x!==null).length/questions.length)*100}%`;
 $("options").innerHTML=q.o.map((v,i)=>`<label class="option ${answers[current]===i?"selected":""}"><input type="radio" name="answer" value="${i}" ${answers[current]===i?"checked":""}>${String.fromCharCode(65+i)}. ${v}</label>`).join("");
 document.querySelectorAll('input[name="answer"]').forEach(el=>el.addEventListener("change",()=>{answers[current]=Number(el.value);render();}));
 $("reviewBtn").textContent=review[current]?"★ Remove review mark":"☆ Mark for review";
 $("prevBtn").disabled=current===0;$("prevBtn").style.opacity=current===0?".45":"1";
 $("nextBtn").textContent=current===questions.length-1?"Finish →":"Next →";
 $("palette").innerHTML=questions.map((_,i)=>`<button class="${i===current?"current":""} ${answers[i]!==null?"answered":""} ${review[i]?"review":""}" data-index="${i}">${i+1}</button>`).join("");
 document.querySelectorAll("#palette button").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.index);render();}));
}
$("prevBtn").addEventListener("click",()=>{if(current>0){current--;render();}});
$("nextBtn").addEventListener("click",()=>{if(current<questions.length-1){current++;render();}else finishExam();});
$("reviewBtn").addEventListener("click",()=>{review[current]=!review[current];render();});
$("submitBtn").addEventListener("click",()=>{const blank=answers.filter(x=>x===null).length;if(blank&&!confirm(`You have ${blank} unanswered question(s). Submit anyway?`))return;finishExam();});
function updateTimer(){const m=Math.floor(remaining/60),s=remaining%60;$("timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
async function finishExam(){
 if(submitted)return;submitted=true;clearInterval(interval);
 let result;
 try{
   const response=await fetch("/api/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentName,studentId,answers})});
   if(!response.ok)throw new Error("Server returned an error");
   result=await response.json();$("serverStatus").textContent="Result calculated by Java backend.";
 }catch(err){
   // Fallback keeps the demo usable if opened without starting the Java server.
   const key=[1,2,0,1,1,1,2,1,0,0];const correct=answers.reduce((n,a,i)=>n+(a===key[i]?1:0),0);
   result={correct,wrong:answers.filter(a=>a!==null).length-correct,unanswered:answers.filter(a=>a===null).length,percentage:correct*10};
   $("serverStatus").textContent="Java server was not reached. Demo fallback result shown; start the Java server for backend evaluation.";
 }
 $("resultStudent").textContent=`${studentName} · ${studentId}`;$("score").textContent=`${result.correct}/10`;
 $("correct").textContent=result.correct;$("wrong").textContent=result.wrong;$("unanswered").textContent=result.unanswered;$("percentage").textContent=`${Number(result.percentage).toFixed(0)}%`;
 $("resultMessage").textContent=result.percentage>=80?"Excellent performance!":result.percentage>=50?"Good work. Keep practising!":"Keep learning and try again!";
 show("resultPage");
}
$("restartBtn").addEventListener("click",()=>{clearInterval(interval);answers=Array(questions.length).fill(null);review=Array(questions.length).fill(false);current=0;remaining=900;submitted=false;$("loginForm").reset();show("loginPage");});
