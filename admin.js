// ==========================================================================
// Shopy অ্যাডমিন প্যানেল লজিক
// ==========================================================================

let products = [];
let orders = [];
let categories = [];
let messages = [];
let editingProductId = null;

const loginShell   = document.getElementById("loginShell");
const adminShell    = document.getElementById("adminShell");
const loginForm     = document.getElementById("loginForm");
const loginError    = document.getElementById("loginError");
const adminUserName = document.getElementById("adminUserName");

// ---------------------------------------------------------------
// অথেনটিকেশন
// ---------------------------------------------------------------
auth.onAuthStateChanged((user)=>{
  if(user){
    loginShell.style.display = "none";
    adminShell.style.display = "flex";
    adminUserName.textContent = user.email;
    loadAll();
  } else {
    loginShell.style.display = "flex";
    adminShell.style.display = "none";
  }
});

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("loginEmail").value;
  const pass  = document.getElementById("loginPass").value;
  const btn = loginForm.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "লগইন হচ্ছে...";
  try{
    await auth.signInWithEmailAndPassword(email, pass);
  }catch(err){
    loginError.textContent = "ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
  }finally{
    btn.disabled = false; btn.textContent = "লগইন করুন";
  }
});

document.getElementById("logoutBtn").addEventListener("click", ()=> auth.signOut());

// ---------------------------------------------------------------
// নেভিগেশন (ট্যাব সুইচিং)
// ---------------------------------------------------------------
document.querySelectorAll(".admin-nav a").forEach(link=>{
  link.addEventListener("click", (e)=>{
    e.preventDefault();
    document.querySelectorAll(".admin-nav a").forEach(a=>a.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll(".admin-page").forEach(p=>p.style.display = "none");
    document.getElementById(link.dataset.page).style.display = "block";
    document.getElementById("sidebarMenu").classList.remove("open");
  });
});
document.getElementById("menuToggle").addEventListener("click", ()=>{
  document.getElementById("sidebarMenu").classList.toggle("open");
});

function money(n){ return "৳" + Number(n||0).toLocaleString("bn-BD"); }

// ---------------------------------------------------------------
// ডেটা লোড
// ---------------------------------------------------------------
async function loadAll(){
  await Promise.all([loadProducts(), loadOrders(), loadCategories(), loadMessages()]);
  renderDashboard();
}

async function loadProducts(){
  try{
    const snap = await productsRef.orderBy("createdAt","desc").get();
    products = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){
    const snap = await productsRef.get().catch(()=>null);
    products = snap ? snap.docs.map(d=>({id:d.id, ...d.data()})) : [];
  }
  renderProductsTable();
}

async function loadOrders(){
  try{
    const snap = await ordersRef.orderBy("createdAt","desc").get();
    orders = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ orders = []; }
  renderOrdersTable();
}

async function loadCategories(){
  try{
    const snap = await categoriesRef.get();
    categories = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ categories = []; }
  renderCategoryList();
  fillCategorySelect();
}

async function loadMessages(){
  try{
    const snap = await db.collection("messages").orderBy("createdAt","desc").get();
    messages = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ messages = []; }
  renderMessagesTable();
  updateUnreadBadge();
}

function subjectLabel(s){
  return {general:"সাধারণ জিজ্ঞাসা", order:"অর্ডার সংক্রান্ত", return:"রিটার্ন/রিফান্ড", complaint:"অভিযোগ", partnership:"ব্যবসায়িক প্রস্তাব"}[s] || "সাধারণ";
}

function formatDate(ts){
  if(!ts || !ts.toDate) return "-";
  const d = ts.toDate();
  return d.toLocaleDateString("bn-BD", {day:"numeric", month:"short", year:"numeric"});
}

function renderMessagesTable(){
  const tbody = document.getElementById("messagesBody");
  if(messages.length === 0){
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--ink-soft);padding:24px;">এখনো কোনো মেসেজ আসেনি</td></tr>`;
    return;
  }
  tbody.innerHTML = messages.map(m=>`
    <tr style="${m.status==='unread' ? 'font-weight:700;' : ''}">
      <td>${m.name||"-"}</td>
      <td>${m.phone||"-"}</td>
      <td>${subjectLabel(m.subject)}</td>
      <td style="max-width:220px;white-space:normal;">${(m.message||"").slice(0,60)}${(m.message||"").length>60?"...":""}</td>
      <td>${formatDate(m.createdAt)}</td>
      <td><span class="tag-status ${m.status==='unread'?'tag-pending':'tag-delivered'}">${m.status==='unread'?"অপঠিত":"পঠিত"}</span></td>
      <td>
        <button class="icon-action" data-view-msg="${m.id}" title="বিস্তারিত">👁️</button>
        <button class="icon-action" data-del-msg="${m.id}" title="মুছুন">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-view-msg]").forEach(b=>{
    b.addEventListener("click", ()=>viewMessage(b.dataset.viewMsg));
  });
  tbody.querySelectorAll("[data-del-msg]").forEach(b=>{
    b.addEventListener("click", ()=>deleteMessage(b.dataset.delMsg));
  });
}

function updateUnreadBadge(){
  const unread = messages.filter(m=>m.status==="unread").length;
  const badge = document.getElementById("unreadBadge");
  badge.textContent = unread;
  badge.style.display = unread > 0 ? "inline-flex" : "none";
}

async function viewMessage(id){
  const m = messages.find(x=>x.id===id);
  if(!m) return;
  document.getElementById("orderDetailBody").innerHTML = `
    <p><strong>নাম:</strong> ${m.name}</p>
    <p><strong>মোবাইল:</strong> ${m.phone}</p>
    ${m.email ? `<p><strong>ইমেইল:</strong> ${m.email}</p>` : ""}
    <p><strong>বিষয়:</strong> ${subjectLabel(m.subject)}</p>
    <p><strong>তারিখ:</strong> ${formatDate(m.createdAt)}</p>
    <p style="margin-top:10px;"><strong>বার্তা:</strong></p>
    <p style="background:var(--cream-2);padding:12px;border-radius:8px;margin-top:6px;">${m.message}</p>
  `;
  document.getElementById("orderDetailModal").classList.add("open");

  if(m.status === "unread"){
    try{
      await db.collection("messages").doc(id).update({status:"read"});
      m.status = "read";
      renderMessagesTable();
      updateUnreadBadge();
    }catch(e){}
  }
}

async function deleteMessage(id){
  if(!confirm("এই মেসেজটি মুছে ফেলতে চান?")) return;
  try{
    await db.collection("messages").doc(id).delete();
    await loadMessages();
  }catch(err){
    alert("মুছতে সমস্যা হয়েছে: " + err.message);
  }
}

// ---------------------------------------------------------------
// ড্যাশবোর্ড
// ---------------------------------------------------------------
function renderDashboard(){
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent = orders.length;
  const revenue = orders.filter(o=>o.status !== "cancelled").reduce((s,o)=>s+(o.total||0),0);
  document.getElementById("statRevenue").textContent = money(revenue);
  const pending = orders.filter(o=>o.status === "pending").length;
  document.getElementById("statPending").textContent = pending;

  const recent = orders.slice(0,5);
  const tbody = document.getElementById("recentOrdersBody");
  tbody.innerHTML = recent.length ? recent.map(o=>`
    <tr>
      <td>${o.customerName||"-"}</td>
      <td>${o.phone||"-"}</td>
      <td>${money(o.total)}</td>
      <td><span class="tag-status tag-${o.status||'pending'}">${statusLabel(o.status)}</span></td>
    </tr>`).join("") : `<tr><td colspan="4" style="text-align:center;color:var(--ink-soft);padding:20px;">এখনো কোনো অর্ডার নেই</td></tr>`;
}

function statusLabel(s){
  return {pending:"পেন্ডিং", processing:"প্রসেসিং", shipped:"শিপড", delivered:"ডেলিভারড", cancelled:"বাতিল"}[s] || "পেন্ডিং";
}

// ---------------------------------------------------------------
// প্রোডাক্ট টেবিল
// ---------------------------------------------------------------
function renderProductsTable(){
  const tbody = document.getElementById("productsBody");
  if(products.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--ink-soft);padding:24px;">কোনো প্রোডাক্ট নেই। "নতুন প্রোডাক্ট" বাটনে ক্লিক করে যোগ করুন।</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p=>`
    <tr>
      <td>${p.image ? `<img class="table-thumb" src="${p.image}">` : `<div class="table-thumb" style="display:flex;align-items:center;justify-content:center;">🛍️</div>`}</td>
      <td>${p.name}</td>
      <td>${p.category||"-"}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock ?? 0}</td>
      <td>
        <button class="icon-action" data-edit="${p.id}" title="সম্পাদনা">✏️</button>
        <button class="icon-action" data-del="${p.id}" title="মুছুন">🗑️</button>
      </td>
    </tr>
  `).join("");
  tbody.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openProductForm(b.dataset.edit)));
  tbody.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.del)));
}

document.getElementById("newProductBtn").addEventListener("click", ()=>openProductForm(null));

function openProductForm(id){
  editingProductId = id;
  const p = id ? products.find(x=>x.id===id) : null;
  document.getElementById("productFormTitle").textContent = p ? "প্রোডাক্ট সম্পাদনা করুন" : "নতুন প্রোডাক্ট যোগ করুন";
  document.getElementById("pfName").value = p?.name || "";
  document.getElementById("pfCategory").value = p?.category || "";
  document.getElementById("pfPrice").value = p?.price || "";
  document.getElementById("pfOldPrice").value = p?.oldPrice || "";
  document.getElementById("pfStock").value = p?.stock ?? "";
  document.getElementById("pfDescription").value = p?.description || "";
  document.getElementById("pfImagePreview").src = p?.image || "";
  document.getElementById("pfImagePreview").style.display = p?.image ? "block" : "none";
  document.getElementById("pfImageData").value = p?.image || "";
  document.getElementById("productModal").classList.add("open");
}

document.querySelectorAll("[data-close-admin-modal]").forEach(b=>{
  b.addEventListener("click", ()=> document.getElementById("productModal").classList.remove("open"));
});

document.getElementById("pfImage").addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 900 * 1024){
    alert("ছবির সাইজ ৯০০KB এর কম হতে হবে");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = ()=>{
    document.getElementById("pfImagePreview").src = reader.result;
    document.getElementById("pfImagePreview").style.display = "block";
    document.getElementById("pfImageData").value = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("productForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const data = {
    name: document.getElementById("pfName").value.trim(),
    category: document.getElementById("pfCategory").value.trim(),
    price: Number(document.getElementById("pfPrice").value),
    oldPrice: document.getElementById("pfOldPrice").value ? Number(document.getElementById("pfOldPrice").value) : null,
    stock: Number(document.getElementById("pfStock").value || 0),
    description: document.getElementById("pfDescription").value.trim(),
    image: document.getElementById("pfImageData").value || "",
    active: true
  };

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "সংরক্ষণ হচ্ছে...";

  try{
    if(editingProductId){
      await productsRef.doc(editingProductId).update(data);
    }else{
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await productsRef.add(data);
      if(data.category && !categories.find(c=>c.name===data.category)){
        categoriesRef.add({name:data.category}).catch(()=>{});
      }
    }
    document.getElementById("productModal").classList.remove("open");
    await loadProducts();
    await loadCategories();
    renderDashboard();
  }catch(err){
    alert("সংরক্ষণ করতে সমস্যা হয়েছে: " + err.message);
  }finally{
    btn.disabled = false; btn.textContent = "সংরক্ষণ করুন";
  }
});

async function deleteProduct(id){
  if(!confirm("আপনি কি নিশ্চিত এই প্রোডাক্টটি মুছে ফেলতে চান?")) return;
  try{
    await productsRef.doc(id).delete();
    await loadProducts();
    renderDashboard();
  }catch(err){
    alert("মুছতে সমস্যা হয়েছে: " + err.message);
  }
}

// ---------------------------------------------------------------
// অর্ডার টেবিল
// ---------------------------------------------------------------
function renderOrdersTable(){
  const tbody = document.getElementById("ordersBody");
  if(orders.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--ink-soft);padding:24px;">এখনো কোনো অর্ডার আসেনি</td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(o=>`
    <tr>
      <td>${o.customerName||"-"}</td>
      <td>${o.phone||"-"}</td>
      <td>${(o.items||[]).length} আইটেম</td>
      <td>${money(o.total)}</td>
      <td>
        <select class="status-select" data-order="${o.id}">
          ${["pending","processing","shipped","delivered","cancelled"].map(s=>
            `<option value="${s}" ${o.status===s?"selected":""}>${statusLabel(s)}</option>`
          ).join("")}
        </select>
      </td>
      <td><button class="icon-action" data-view-order="${o.id}" title="বিস্তারিত">👁️</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".status-select").forEach(sel=>{
    sel.addEventListener("change", async ()=>{
      try{
        await ordersRef.doc(sel.dataset.order).update({status: sel.value});
        await loadOrders();
        renderDashboard();
      }catch(err){ alert("স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে"); }
    });
  });
  tbody.querySelectorAll("[data-view-order]").forEach(b=>{
    b.addEventListener("click", ()=>viewOrder(b.dataset.viewOrder));
  });
}

function viewOrder(id){
  const o = orders.find(x=>x.id===id);
  if(!o) return;
  const itemsHtml = (o.items||[]).map(i=>`<li>${i.name} × ${i.qty} — ${money(i.price*i.qty)}</li>`).join("");
  document.getElementById("orderDetailBody").innerHTML = `
    <p><strong>ক্রেতা:</strong> ${o.customerName}</p>
    <p><strong>মোবাইল:</strong> ${o.phone}</p>
    <p><strong>ঠিকানা:</strong> ${o.address}</p>
    <p><strong>পেমেন্ট:</strong> ${o.paymentMethod === "bkash" ? "বিকাশ" : "ক্যাশ অন ডেলিভারি"}</p>
    <p><strong>প্রোডাক্ট:</strong></p>
    <ul style="margin:6px 0 12px 20px;">${itemsHtml}</ul>
    <p><strong>মোট: ${money(o.total)}</strong></p>
  `;
  document.getElementById("orderDetailModal").classList.add("open");
}

// ---------------------------------------------------------------
// ক্যাটাগরি
// ---------------------------------------------------------------
function renderCategoryList(){
  const wrap = document.getElementById("categoryList");
  wrap.innerHTML = categories.length ? categories.map(c=>`
    <div class="radio-opt" style="justify-content:space-between;">
      <span>${c.name}</span>
      <button class="icon-action" data-del-cat="${c.id}">🗑️</button>
    </div>`).join("") : `<p style="color:var(--ink-soft);">কোনো ক্যাটাগরি নেই</p>`;
  wrap.querySelectorAll("[data-del-cat]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("ক্যাটাগরি মুছবেন?")) return;
      await categoriesRef.doc(b.dataset.delCat).delete();
      await loadCategories();
    });
  });
}

function fillCategorySelect(){
  const dl = document.getElementById("categoryDatalist");
  if(dl) dl.innerHTML = categories.map(c=>`<option value="${c.name}">`).join("");
}

document.getElementById("addCategoryForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if(!name) return;
  await categoriesRef.add({name});
  input.value = "";
  await loadCategories();
});
