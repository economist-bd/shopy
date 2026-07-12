// ==========================================================================
// Shopy স্টোরফ্রন্ট লজিক
// ==========================================================================

let allProducts = [];
let activeCategory = "সব";
let searchTerm = "";
let cart = JSON.parse(localStorage.getItem("shopy_cart") || "[]");

const grid          = document.getElementById("productGrid");
const catNav         = document.getElementById("categoryNav");
const searchInput    = document.getElementById("searchInput");
const cartCountEl    = document.getElementById("cartCount");
const drawer         = document.getElementById("cartDrawer");
const overlay        = document.getElementById("overlay");
const drawerBody     = document.getElementById("drawerBody");
const totalRow       = document.getElementById("cartTotal");
const productModal   = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");
const checkoutModal  = document.getElementById("checkoutModal");
const toastEl        = document.getElementById("toast");

function money(n){ return "৳" + Number(n).toLocaleString("bn-BD"); }

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(()=>toastEl.classList.remove("show"), 2200);
}

function saveCart(){
  localStorage.setItem("shopy_cart", JSON.stringify(cart));
  renderCartCount();
}

function renderCartCount(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  cartCountEl.textContent = count;
  cartCountEl.style.display = count > 0 ? "flex" : "none";
}

// ---------------------------------------------------------------
// প্রোডাক্ট লোড করা (Firestore থেকে; ব্যর্থ হলে ডেমো ডেটা)
// ---------------------------------------------------------------
async function loadProducts(){
  try{
    const snap = await productsRef.where("active","!=",false).get();
    if(!snap.empty){
      allProducts = snap.docs.map(d=>({id:d.id, ...d.data()}));
    } else {
      allProducts = demoProducts();
    }
  }catch(e){
    console.warn("Firestore থেকে প্রোডাক্ট লোড করা যায়নি, ডেমো ডেটা ব্যবহার হচ্ছে:", e.message);
    allProducts = demoProducts();
  }
  buildCategoryNav();
  renderProducts();
}

function demoProducts(){
  return [
    {id:"d1", name:"হাতে বোনা নকশি শাল", category:"ফ্যাশন", price:850, oldPrice:1100, stock:12, image:"", featured:true},
    {id:"d2", name:"জামদানি প্রিন্ট থ্রি-পিস", category:"ফ্যাশন", price:1450, stock:6, image:""},
    {id:"d3", name:"খাঁটি সরিষার তেল (৫০০মিলি)", category:"খাবার", price:280, stock:30, image:""},
    {id:"d4", name:"হ্যান্ডমেড মাটির চায়ের কাপ সেট", category:"ঘর ও রান্না", price:520, oldPrice:650, stock:15, image:""},
    {id:"d5", name:"ব্লুটুথ ইয়ারবাডস প্রো", category:"ইলেকট্রনিক্স", price:1990, stock:0, image:""},
    {id:"d6", name:"চামড়ার হাতে তৈরি মানিব্যাগ", category:"ফ্যাশন", price:690, stock:20, image:""},
    {id:"d7", name:"অর্গানিক মধু (৫০০গ্রাম)", category:"খাবার", price:650, stock:18, image:"", featured:true},
    {id:"d8", name:"রিকশা-আর্ট ক্যানভাস টোট ব্যাগ", category:"ফ্যাশন", price:420, stock:25, image:""},
  ];
}

function buildCategoryNav(){
  const cats = ["সব", ...new Set(allProducts.map(p=>p.category).filter(Boolean))];
  catNav.innerHTML = cats.map(c=>
    `<button class="cat-chip ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`
  ).join("");
  catNav.querySelectorAll(".cat-chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      activeCategory = btn.dataset.cat;
      buildCategoryNav();
      renderProducts();
    });
  });
}

function renderProducts(){
  let list = allProducts.filter(p=>{
    const matchCat = activeCategory === "সব" || p.category === activeCategory;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  if(list.length === 0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="big">🔍</div>
      <h3>কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
      <p>অন্য কিছু খুঁজে দেখুন অথবা ক্যাটাগরি পরিবর্তন করুন</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p=>{
    const outOfStock = Number(p.stock) <= 0;
    return `
    <div class="product-card" data-id="${p.id}">
      ${p.oldPrice ? `<span class="badge">ছাড়</span>` : (outOfStock ? `<span class="badge stock">স্টক নেই</span>`:"")}
      <div class="product-thumb" data-open="${p.id}">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="placeholder">🛍️</span>`}
      </div>
      <div class="product-body">
        <span class="product-cat">${p.category||""}</span>
        <div class="product-name" data-open="${p.id}">${p.name}</div>
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>`:""}
        </div>
        <button class="add-btn" data-add="${p.id}" ${outOfStock?"disabled":""}>
          ${outOfStock ? "স্টক নেই" : "কার্টে যোগ করুন"}
        </button>
      </div>
    </div>`;
  }).join("");

  grid.querySelectorAll("[data-open]").forEach(el=>{
    el.addEventListener("click", ()=>openProductModal(el.dataset.open));
  });
  grid.querySelectorAll("[data-add]").forEach(el=>{
    el.addEventListener("click", (e)=>{ e.stopPropagation(); addToCart(el.dataset.add); });
  });
}

searchInput.addEventListener("input", (e)=>{
  searchTerm = e.target.value;
  renderProducts();
});

// ---------------------------------------------------------------
// প্রোডাক্ট ডিটেইল মোডাল
// ---------------------------------------------------------------
function openProductModal(id){
  const p = allProducts.find(x=>x.id===id);
  if(!p) return;
  const outOfStock = Number(p.stock) <= 0;
  productModalBody.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="placeholder" style="font-size:70px;opacity:.3">🛍️</span>`}
      </div>
      <div class="product-detail-info">
        <span class="product-cat">${p.category||""}</span>
        <h2 style="margin:8px 0 12px;font-size:22px;">${p.name}</h2>
        <div class="price-row" style="margin-bottom:14px;">
          <span class="price" style="font-size:24px;">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>`:""}
        </div>
        <p style="color:var(--ink-soft);margin-bottom:18px;">${p.description || "এই প্রোডাক্টের বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে।"}</p>
        <p style="font-size:13px;color:${outOfStock?'var(--rickshaw-red)':'var(--jute)'};margin-bottom:16px;font-weight:700;">
          ${outOfStock ? "❌ স্টকে নেই" : `✅ স্টকে আছে (${p.stock} পিস)`}
        </p>
        <button class="btn" style="width:100%;justify-content:center" data-add="${p.id}" ${outOfStock?"disabled":""}>
          ${outOfStock ? "স্টক নেই" : "কার্টে যোগ করুন"}
        </button>
      </div>
    </div>`;
  productModalBody.querySelector("[data-add]")?.addEventListener("click", ()=>{
    addToCart(p.id);
    closeModal(productModal);
  });
  openModal(productModal);
}

// ---------------------------------------------------------------
// কার্ট
// ---------------------------------------------------------------
function addToCart(id){
  const p = allProducts.find(x=>x.id===id);
  if(!p || Number(p.stock) <= 0) return;
  const existing = cart.find(i=>i.id===id);
  if(existing){ existing.qty += 1; }
  else{ cart.push({id:p.id, name:p.name, price:p.price, image:p.image||"", qty:1}); }
  saveCart();
  showToast(`"${p.name}" কার্টে যোগ হয়েছে`);
}

function changeQty(id, delta){
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ cart = cart.filter(i=>i.id!==id); }
  saveCart();
  renderCart();
}

function removeItem(id){
  cart = cart.filter(i=>i.id!==id);
  saveCart();
  renderCart();
}

function renderCart(){
  if(cart.length === 0){
    drawerBody.innerHTML = `<div class="empty-state">
      <div class="big">🛒</div>
      <h3>আপনার কার্ট খালি</h3>
      <p>প্রোডাক্ট যোগ করে কেনাকাটা শুরু করুন</p>
    </div>`;
    totalRow.innerHTML = "";
    document.getElementById("checkoutBtn").disabled = true;
    return;
  }
  document.getElementById("checkoutBtn").disabled = false;
  drawerBody.innerHTML = cart.map(i=>`
    <div class="cart-item" data-id="${i.id}">
      ${i.image ? `<img src="${i.image}" alt="${i.name}">` : `<div style="width:64px;height:64px;background:var(--cream-2);border-radius:8px;display:flex;align-items:center;justify-content:center;">🛍️</div>`}
      <div class="cart-item-info">
        <div class="name">${i.name}</div>
        <div class="price">${money(i.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-dec="${i.id}">−</button>
          <span>${i.qty}</span>
          <button class="qty-btn" data-inc="${i.id}">+</button>
          <button class="remove-link" data-remove="${i.id}">সরান</button>
        </div>
      </div>
    </div>
  `).join("");

  drawerBody.querySelectorAll("[data-inc]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.inc,1)));
  drawerBody.querySelectorAll("[data-dec]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.dec,-1)));
  drawerBody.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>removeItem(b.dataset.remove)));

  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  totalRow.innerHTML = `<div class="total-row"><span>মোট</span><span>${money(total)}</span></div>`;
}

document.getElementById("cartBtn").addEventListener("click", ()=>{
  renderCart();
  openDrawer();
});
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
overlay.addEventListener("click", ()=>{ closeDrawer(); closeModal(productModal); closeModal(checkoutModal); });

function openDrawer(){ drawer.classList.add("open"); overlay.classList.add("open"); }
function closeDrawer(){ drawer.classList.remove("open"); overlay.classList.remove("open"); }
function openModal(m){ m.classList.add("open"); overlay.classList.add("open"); }
function closeModal(m){ m.classList.remove("open"); overlay.classList.remove("open"); }

document.querySelectorAll("[data-close-modal]").forEach(b=>{
  b.addEventListener("click", ()=>{ closeModal(productModal); closeModal(checkoutModal); });
});

// ---------------------------------------------------------------
// চেকআউট
// ---------------------------------------------------------------
document.getElementById("checkoutBtn").addEventListener("click", ()=>{
  closeDrawer();
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById("checkoutTotal").textContent = money(total);
  openModal(checkoutModal);
});

document.getElementById("checkoutForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const order = {
    customerName: fd.get("name"),
    phone: fd.get("phone"),
    address: fd.get("address"),
    paymentMethod: fd.get("payment"),
    items: cart.map(i=>({productId:i.id, name:i.name, price:i.price, qty:i.qty})),
    total: cart.reduce((s,i)=>s+i.price*i.qty,0),
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "অর্ডার হচ্ছে...";

  try{
    await ordersRef.add(order);
    // স্টক কমানো (ডেমো ডেটায় স্কিপ)
    for(const item of cart){
      if(!item.id.startsWith("d")){
        productsRef.doc(item.id).update({
          stock: firebase.firestore.FieldValue.increment(-item.qty)
        }).catch(()=>{});
      }
    }
    cart = [];
    saveCart();
    closeModal(checkoutModal);
    showToast("✅ আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!");
    e.target.reset();
  }catch(err){
    console.error(err);
    showToast("⚠️ অর্ডার করতে সমস্যা হয়েছে, আবার চেষ্টা করুন");
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "অর্ডার নিশ্চিত করুন";
  }
});

// ---------------------------------------------------------------
// ইনিট
// ---------------------------------------------------------------
renderCartCount();
loadProducts();
