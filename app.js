//=========================================================
// CONSTANT
//=========================================================

const IN_PROGRESS = "IN_PROGRESS"
const DONE = "DONE"
const TODO = "TODO"
const TRASH = "TRASH"

const STATUS_COLOR = {
  [TODO]: "#F6E05E",
  [IN_PROGRESS]: "#68D391",
  [DONE]: "#63B3ED",
  [TRASH]: "#F687B3",
}

//=========================================================
// LOCAL DATABASE
//=========================================================

const DB = (function () {
  if (!localStorage.getItem("todo_app")) {
    localStorage.setItem(
      "todo_app",
      JSON.stringify({
        1: {
          id: 1,
          title: "Contoh Todo",
          desc: `Ini adalah deskripsi dari contoh todo.`,
          status: TODO,
        },
      })
    )
  }
  return getFromLocalStorage()
})()

// Mengambil database yang ada di localStorage
function getFromLocalStorage() {
  return JSON.parse(localStorage.getItem("todo_app"))
}

// Menyimpan data ke localStorage
function saveToLocalStorage() {
  localStorage.setItem("todo_app", JSON.stringify(DB))
}

// Membuat data todo baru
function createNewTodo(title, desc) {
  // Menghitung id berikutnya dengan mencari id tertinggi yang tersedia di database
  // apabila tidak tersidia makan max adalah -Infinity maka perlu dibandikan lagi dengan 0
  // sehingga menjamin id tidak -Infinity.
  const id = Math.max(...Object.keys(DB).map((item) => parseInt(item)), 0) + 1
  DB[id] = {
    id,
    title,
    desc,
    status: TODO,
  }
  saveToLocalStorage()
  return { ...DB[id] }
}

// Menandai item todo sebgai 'TODO', 'IN_PROGRESS', 'DONE' atau 'TRASH'
function markTodoAs(id, status) {
  if (DB[id] !== undefined) {
    DB[id].status = status
    saveToLocalStorage()
  }
}

// Mengembalikan array dari todo yang memiliki status 'TODO'
function getTodoList() {
  return Object.values(DB).filter((item) => item.status === TODO)
}

// Mengembalikan array dari todo yang memiliki status 'IN_PROGRESS'
function getInProgressList() {
  return Object.values(DB).filter((item) => item.status === IN_PROGRESS)
}

// Mengembalikan array dari todo yang memiliki status 'DONE'
function getDoneList() {
  return Object.values(DB).filter((item) => item.status === DONE)
}

// Mengembalikan array dari todo yang memiliki status 'TRASH'
function getTrashList() {
  return Object.values(DB).filter((item) => item.status === TRASH)
}

// Membersihkan todo dari trash. Dengan demikian todo yang berada di trash
// sudah dihapus secara permanen
function cleanupTrash() {
  const trash = getTrashList()
  for (const item of trash) {
    delete DB[item.id]
  }
  saveToLocalStorage()
}

//=========================================================
// DRAGGABLE
//==========================================================

// Membuat node menjadi draggable (drag origin).
// Sehingga node ini nantinya bisa di drag ke drag target.
function createDragable(node) {
  node.addEventListener(
    "dragstart",
    function (evt) {
      evt.dataTransfer.setDragImage(node, 0, 0)
      node.classList.add("on-drag")
    },
    false
  )

  node.addEventListener("dragend", function (evt) {
    node.classList.remove("on-drag")
  })

  return node
}

// Membuat node menjadi drag target.
// Sehingga ketika drag over, node origin yang di drag ke node ini
// akan mejadi child dari node ini.
function createDragableTarget(node) {
  node.addEventListener("dragleave", function (evt) {
    node.classList.remove("on-hover")
  })

  node.addEventListener("dragover", function (evt) {
    node.classList.add("on-hover")

    const onDragItem = document.querySelector(".on-drag")
    const currentChildren = node.querySelectorAll(".card-item")

    const closest = getClosestNode(currentChildren, evt.clientY)

    if (node !== null) {
      updateStatus(node, onDragItem)
    }

    node.querySelector("ul").insertBefore(onDragItem, closest)
  })

  return node
}

// Mencari node yang memiliki jarak terdekat dengan
// yAxis dari node yang sedang di drag.
// Dengean demikian dapat ditentukan dimana posisi node baru nantinya
// akan ditempatkan.
function getClosestNode(nodes, yAxis) {
  const closest = { dist: -Infinity, node: null }

  nodes.forEach((child) => {
    const boundary = child.getBoundingClientRect()
    const dist = yAxis - boundary.top - boundary.height / 2
    if (dist < 0 && dist > closest.dist) {
      closest.node = child
      closest.dist = dist
    }
  })
  return closest.node
}

// Mengubah status dari todo item secara otomatis
// dengan berdasarkan drag target.
function updateStatus(card, target) {
  const todoId = target.getAttribute("data-todo-id")

  const destinyStatus = card.getAttribute("data-todo-name").toUpperCase()

  target.querySelector(".indicator").style.backgroundColor =
    STATUS_COLOR[destinyStatus]

  markTodoAs(todoId, destinyStatus)
}

// =======================================================
//  RENDER
// =======================================================

// Membuat dom tree yang digunakan untuk menampilkan todo ke web page.
// Hasil akhir akan terlihat seperti berikut.
// <li class="card-item" draggable="true"  data-todo-id={todo.id} >
//   <div class="head">
//     <h3>{todo.title}</h3>
//     <span class="indicator"></span>
//   </div>
//   <p>
//      {todo.desc}
//  </p>
// </li>
function createTodoHtmlNode(todo) {
  const li = document.createElement("li")
  li.classList.add("card-item")
  li.setAttribute("draggable", "true")
  li.setAttribute("data-todo-id", todo.id)

  const head = document.createElement("div")
  head.classList.add("head")

  const h3 = document.createElement("h3")
  h3.textContent = todo.title

  const span = document.createElement("span")
  span.classList.add("indicator")
  span.style.backgroundColor = STATUS_COLOR[todo.status]

  const p = document.createElement("p")
  p.innerText = todo.desc

  head.appendChild(h3)
  head.appendChild(span)
  li.appendChild(head)
  li.appendChild(p)

  createDragable(li)

  return li
}

// Merender node ke todo-list-container
function renderTodoHtmlNode(node) {
  const todoListContainer = document.getElementById("todo-list-container")
  todoListContainer.appendChild(node)
}

// Merender node ke inprogress-list-container
function renderInProgressHtmlNode(node) {
  const inProgressListContainer = document.getElementById(
    "inprogress-list-container"
  )
  inProgressListContainer.appendChild(node)
}

// Merender node ke done-list-container
function renderDoneHtmlNode(node) {
  const doneListContainer = document.getElementById("done-list-container")
  doneListContainer.appendChild(node)
}

// Merender node ke trash-list-container
function renderTrashHtmlNode(node) {
  const trashListContainer = document.getElementById("trash-list-container")

  trashListContainer.appendChild(node)
}

// =======================================================
// Modal
// =======================================================

// Selector
const modal = document.querySelector(".modal")
const openModal = document.getElementById("open-modal")
const addBtn = document.getElementById("btn-add")
const closeBtn = document.getElementById("btn-close")
const todoDesc = document.getElementById("desc")
const todoTitle = document.getElementById("title")
const titleError = document.getElementById("title-error")
const descError = document.getElementById("desc-error")

// Listener
openModal.addEventListener("click", function (e) {
  modal.classList.add("show")
  modal.classList.remove("disable-pointer")
})

closeBtn.addEventListener("click", (e) => {
  e.preventDefault()
  modal.classList.remove("show")
  modal.classList.add("disable-pointer")
})

todoTitle.addEventListener("focus", (e) => {
  titleError.classList.remove("show")
})

todoDesc.addEventListener("focus", (e) => {
  descError.classList.remove("show")
})

addBtn.addEventListener("click", (e) => {
  e.preventDefault()

  const title = todoTitle.value.trim()
  const desc = todoDesc.value.trim()
  if (!title) {
    titleError.innerText = "Title is required"
    titleError.classList.add("show")
    return
  }

  if (title.length < 4) {
    titleError.innerText = "Title min. 4 charaters."
    titleError.classList.add("show")
    return
  }

  if (!desc) {
    descError.innerText = "Description is required"
    descError.classList.add("show")
    return
  }

  if (desc.length < 6) {
    descError.innerText = "Description min. 6 charaters."
    descError.classList.add("show")
    return
  }

  const newTodo = createNewTodo(title, desc)
  renderTodoHtmlNode(createTodoHtmlNode(newTodo))

  todoDesc.value = ""
  todoTitle.value = ""
})

// =======================================================
// TRASH
// =======================================================
const cleanTrashBtn = document.getElementById("clean-trash")

cleanTrashBtn.addEventListener("click", () => {
  cleanupTrash()
  const trashListContainer = document.getElementById("trash-list-container")
  trashListContainer.innerHTML = ""
})

// ========================================================
// THEME
// ========================================================
const themeBtn = document.querySelector(".toggle-theme")
const themesBox = document.querySelector(".themes")
const themesOpt = document.querySelectorAll(".theme")

const themeColors = [
  "#718096",
  "#F56565",
  "#D69E2E",
  "#38A169",
  "#805AD5",
  "#3182CE",
  "#D53F8C",
]

themeBtn.addEventListener("click", () => {
  themesBox.classList.toggle("show")
  themesBox.classList.toggle("disable-pointer")
  themesBox.classList.toggle("move-down")
})

themesOpt.forEach((item, i) => {
  item.style.backgroundColor = themeColors[i]

  item.addEventListener("click", (e) => {
    themesBox.classList.toggle("show")
    themesBox.classList.toggle("disable-pointer")
    themesBox.classList.toggle("move-down")
    document.body.style.backgroundColor = themeColors[i]
  })
})

// ========================================================
// App
// ========================================================
start()

function start() {
  getTodoList().map(createTodoHtmlNode).forEach(renderTodoHtmlNode)

  getInProgressList().map(createTodoHtmlNode).forEach(renderInProgressHtmlNode)

  getDoneList().map(createTodoHtmlNode).forEach(renderDoneHtmlNode)

  getTrashList().map(createTodoHtmlNode).forEach(renderTrashHtmlNode)

  document.querySelectorAll(".card").forEach(createDragableTarget)
}
