const $ = (id) => document.getElementById(id);
const main = $("main"), listEl = $("list"), detailEl = $("detail"), countEl = $("count");
const formDialog = $("formDialog"), postForm = $("postForm"), confirmDialog = $("confirmDialog");

let posts = [];
let current = null;   // 상세로 보고 있는 게시글
let editingId = null; // 수정 중인 게시글 id (새 글이면 null)

// ---------- API ----------
async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(res.status === 422 ? "입력값을 확인해 주세요" : `요청 실패 (${res.status})`);
  return res.json();
}

// ---------- 화면 조각 ----------
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

function emptyState(mark, title, desc) {
  return el("div", { class: "empty" },
    el("div", { class: "mark", text: mark }),
    el("strong", { text: title }),
    el("span", { text: desc }));
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

let toastTimer;
function toast(message, isError = false) {
  const t = $("toast");
  t.textContent = message;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2400);
}

// ---------- 목록 ----------
function renderList() {
  countEl.textContent = posts.length;
  listEl.replaceChildren();
  if (posts.length === 0) {
    listEl.append(el("li", { style: "height:100%;display:flex" },
      emptyState("✎", "아직 글이 없어요", "첫 번째 글을 작성해 보세요")));
    return;
  }
  // 최신 글이 위로 오도록 역순으로 표시
  for (const p of [...posts].reverse()) {
    const btn = el("button", { class: "item", type: "button", onclick: () => openPost(p.id) },
      el("span", { class: "no", text: p.id }),
      el("span", { class: "title", text: p.title }));
    if (current && current.id === p.id) btn.setAttribute("aria-current", "true");
    listEl.append(el("li", {}, btn));
  }
}

async function loadList() {
  try {
    posts = await api("/posts");
    renderList();
  } catch (e) {
    toast("목록을 불러오지 못했어요", true);
  }
}

// ---------- 상세 ----------
function renderDetail() {
  detailEl.replaceChildren();
  if (!current) {
    detailEl.style.display = "flex";
    detailEl.append(emptyState("☰", "글을 선택해 주세요", "목록에서 글을 누르면 내용이 여기에 표시됩니다"));
    return;
  }
  detailEl.style.display = "";
  const p = current;
  const date = formatDate(p.created_at);
  detailEl.append(
    el("button", { class: "btn back", type: "button", onclick: showList, text: "← 목록" }),
    el("h2", { text: p.title }),
    el("div", { class: "meta" },
      el("span", { class: "author" },
        el("span", { class: "avatar", text: (p.user_id || "?").trim().charAt(0).toUpperCase() || "?" }),
        el("span", { text: p.user_id })),
      el("span", { text: `#${p.id}` }),
      date ? el("span", { text: date }) : ""),
    el("div", { class: "body", text: p.content }),
    el("div", { class: "actions" },
      el("button", { class: "btn", type: "button", onclick: () => openForm(p), text: "수정" }),
      el("button", { class: "btn danger", type: "button", onclick: () => askDelete(p), text: "삭제" })));
  detailEl.scrollTop = 0;
}

async function openPost(id) {
  try {
    const data = await api(`/posts/${id}`);
    // 없는 글이면 서버가 객체 대신 문자열을 돌려준다
    if (!data || typeof data !== "object") {
      toast("게시글이 없어요", true);
      current = null;
      await loadList();
      renderDetail();
      return;
    }
    current = data;
    main.dataset.view = "detail";
    renderList();
    renderDetail();
  } catch (e) {
    toast(e.message, true);
  }
}

function showList() {
  main.dataset.view = "list";
}

// ---------- 작성 / 수정 ----------
function openForm(post) {
  editingId = post ? post.id : null;
  $("formTitle").textContent = post ? "글 수정" : "새 글 작성";
  $("submitBtn").textContent = post ? "저장" : "등록";
  $("fTitle").value = post ? post.title : "";
  $("fContent").value = post ? post.content : "";
  $("fUser").value = post ? post.user_id : (localStorage.getItem("board_user") || "");
  formDialog.showModal();
  $("fTitle").focus();
}

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    title: $("fTitle").value.trim(),
    content: $("fContent").value.trim(),
    user_id: $("fUser").value.trim(),
  };
  if (!body.title || !body.content || !body.user_id) {
    toast("제목, 작성자, 내용을 모두 입력해 주세요", true);
    return;
  }
  const submitBtn = $("submitBtn");
  submitBtn.disabled = true;
  try {
    const saved = editingId === null
      ? await api("/posts", "POST", body)
      : await api(`/posts/${editingId}`, "PUT", body);
    if (!saved || typeof saved !== "object") throw new Error("게시글이 없어요");
    localStorage.setItem("board_user", body.user_id);
    toast(editingId === null ? "등록했어요" : "수정했어요");
    formDialog.close();
    current = saved;
    main.dataset.view = "detail";
    await loadList();
    renderDetail();
  } catch (err) {
    toast(err.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- 삭제 ----------
function askDelete(post) {
  $("confirmText").textContent = `"${post.title}" 글이 삭제되며 되돌릴 수 없습니다.`;
  confirmDialog.returnValue = "cancel";
  confirmDialog.showModal();
  confirmDialog.onclose = async () => {
    if (confirmDialog.returnValue !== "ok") return;
    try {
      await api(`/posts/${post.id}`, "DELETE");
      toast("삭제했어요");
      current = null;
      showList();
      await loadList();
      renderDetail();
    } catch (err) {
      toast(err.message, true);
    }
  };
}

// ---------- 시작 ----------
$("newBtn").addEventListener("click", () => openForm(null));
$("cancelBtn").addEventListener("click", () => formDialog.close());
for (const d of [formDialog, confirmDialog]) {
  // 바깥(배경) 클릭 시 닫기
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
}

renderDetail();
loadList();
