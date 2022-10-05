const r = document.querySelector(":root");
const board = document.querySelector(".board");
const selectionDiv = document.querySelector(".selection");
const btnList = document.querySelectorAll(".btn");

// Array to store all memos used in local storage
let localStorageMemos = JSON.parse(localStorage.getItem("memos")) || [];

let memoList = [];

// Get theme from local storage
const lsTheme = localStorage.getItem("theme") || "";

// Used to determine if a user is clicking and holding on the board to create a new memo.
let mouseClicked = false;

// Used to determine if the user is currently dragging / repositioning a memo.
let movingMemo = false;

// Used to determine if the user is currently resizing a memo.
let resizingMemo = false;

// Mouse coordinates to determine the size and position of new memos
let offsetXStart = 0;
let offsetYStart = 0;
let offsetXEnd = 0;
let offsetYEnd = 0;

// current offsets used for the selection div
let offsetYCurrent = 0;
let offsetXCurrent = 0;

let theme = "";

board.addEventListener("mousedown", (e) => {
  mouseClicked = true;

  // set starting mouse coordinates
  offsetXStart = e.offsetX;
  offsetYStart = e.offsetY;

  // if another memo is not currently being moved around.
  if (!movingMemo) {
    selectionDiv.style.top = `${offsetYStart}px`;
    selectionDiv.style.left = `${offsetXStart}px`;
    selectionDiv.style.display = "block";
    board.style.cursor = "crosshair";
  }
});

board.addEventListener("mouseup", (e) => {
  mouseClicked = false;
  offsetXEnd = e.offsetX;
  offsetYEnd = e.offsetY;

  let width = offsetXEnd - offsetXStart;
  let height = offsetYEnd - offsetYStart;

  // Memo has to be larger than 50px * 50px and user should not be currently repositioning another memo.
  if (width >= 50 && height >= 50 && !movingMemo && !resizingMemo) {
    // Create new memo
    let memo = new Memo(
      Date.now(),
      { left: offsetXStart, top: offsetYStart },
      { width, height },
      "" // Blank as no content on initialization
    );
    memoList.push(memo);
    updateLocalStorage();
    memo.focusMemo();
  }

  // Hide the selection area div and change cursor back
  selectionDiv.style.width = "0px";
  selectionDiv.style.height = "0px";
  selectionDiv.style.display = "none";
  board.style.cursor = "default";
});

board.addEventListener("mousemove", (e) => {
  if (mouseClicked && !movingMemo && !resizingMemo) {
    offsetXCurrent = e.offsetX - offsetXStart;
    offsetYCurrent = e.offsetY - offsetYStart;

    selectionDiv.style.width = `${offsetXCurrent}px`;
    selectionDiv.style.height = `${offsetYCurrent}px`;
  }
});

class Memo {
  constructor(id, position, size, content, rootStyle) {
    this.id = id; // Unique number
    this.position = position;
    this.size = size;
    this.content = content;
    this.moving = false;
    this.resizing = false;
    this.rootStyle = rootStyle || null;
    this.createMemo();
  }

  createMemo() {
    this.div = document.createElement("div");
    this.div.classList.add("memo");

    this.div.style.top = `${this.position.top}px`;
    this.div.style.left = `${this.position.left}px`;
    this.div.style.width = `${this.size.width}px`;
    this.div.style.height = `${this.size.height}px`;

    this.move = document.createElement("div");
    this.move.classList.add("move");
    this.move.addEventListener("mousedown", this.mouseDownMove.bind(this));
    window.addEventListener("mouseup", this.mouseUp.bind(this));
    this.div.appendChild(this.move);

    this.close = document.createElement("div");
    this.close.innerText = "X"; //added the innerText as a sort of indication where user can click to delete the note
    this.close.classList.add("close");
    this.move.appendChild(this.close);
    this.close.addEventListener("click", this.deleteMemo.bind(this));
    this.close.addEventListener("keypress", this.deleteMemoKeyboard.bind(this));
    this.close.tabIndex = 0;

    this.text = document.createElement("textarea");
    this.text.classList.add("text");
    this.text.value = this.content;
    this.text.addEventListener("keyup", this.updateText.bind(this));
    this.text.addEventListener("blur", updateLocalStorage);
    this.div.appendChild(this.text);

    this.resize = document.createElement("div");
    this.resize.classList.add("resize");
    this.resize.addEventListener("mousedown", this.mouseDownResize.bind(this));
    this.div.appendChild(this.resize);

    board.appendChild(this.div);

    if (this.rootStyle !== null) {
      r.style.setProperty("--border-color", this.rootStyle['--border-color']);
      r.style.setProperty("--memo-bg-color", this.rootStyle['--memo-bg-color']);
    }
  }

  mouseDownMove(e) {
    // Set to true to stop another memo being created whilst we are moving a memo.
    movingMemo = true;

    // Used in the moveMemo function.
    this.moving = true;

    this.move.style.cursor = "grabbing";
    if (theme == "btn4") {
      this.move.style.backgroundColor = "#B4FF39";
    } else if (theme == "btn3") {
      this.move.style.backgroundColor = "#9042ff";
    } else if (theme == "btn2") {
      this.move.style.backgroundColor = "#64E3FF";
    } else if (theme == "btn1") {
      this.move.style.backgroundColor = "#FFE27D";
    } else {
      this.move.style.backgroundColor = "#fcc42a";
    }
    // determine where the grab cursor is to position the memo relative the the offset and mouse position.
    this.movingXDist = e.clientX - this.position.left;
    this.movingYDist = e.clientY - this.position.top;
  }

  mouseDownResize(e) {
    resizingMemo = true;
    this.resizing = true;
  }

  mouseUp() {
    const currentPosition = {
      left: this.position.left,
      top: this.position.top,
    };
    Object.freeze(currentPosition);

    const currentSize = { width: this.size.width, height: this.size.height };
    Object.freeze(currentSize);

    movingMemo = false;
    resizingMemo = false;

    this.moving = false;
    this.resizing = false;

    this.move.style.cursor = "grab";
    this.move.style.backgroundColor = "transparent";
    // Reset the div position once the element has been moved
    this.position.top = this.div.offsetTop;
    this.position.left = this.div.offsetLeft;

    // Adjust memo positions if they are dragged out of bounds

    if (this.position.top < 0) {
      this.position.top = 0;
      this.div.style.top = 0;
    }

    let boardHeight = board.getBoundingClientRect().bottom;

    if (this.position.top + this.size.height > boardHeight) {
      this.position.top = boardHeight - (this.size.height + 10);
      this.div.style.top = `${this.position.top}px`;
    }

    if (this.position.left < 0) {
      this.position.left = 0;
      this.div.style.left = "0px";
    }

    let boardRight = board.getBoundingClientRect().right;

    if (this.position.left + this.size.width > boardRight) {
      this.position.left = boardRight - (this.size.width + 10);
      this.div.style.left = `${this.position.left}px`;
    }

    // Stringify to compare the objects as objects compare on a reference basis.
    if (
      JSON.stringify(this.position) != JSON.stringify(currentPosition) ||
      JSON.stringify(this.size) != JSON.stringify(currentSize)
    ) {
      // Update memo position and size data in local storage.
      updateLocalStorage();
      this.focusMemo();
    }
  }

  deleteMemo() {
    memoList = memoList.filter((memo) => {
      return memo.id != this.id;
    });

    updateLocalStorage();
    this.div.remove();
  }

  deleteMemoKeyboard(e) {
    memoList = memoList.filter((memo) => {
      return memo.id != this.id;
    });

    if (e.key === "Enter") {
      updateLocalStorage();
      this.div.remove();
    }
  }

  moveMemo(e) {
    // Move memo subtracting moving distances to account for mouse offset position within the move div.
    this.div.style.top = `${e.clientY - this.movingYDist}px`;
    this.div.style.left = `${e.clientX - this.movingXDist}px`;
  }

  resizeMemo(e) {
    let height = e.clientY - this.position.top;
    let width = e.clientX - this.position.left;

    //limit the size to a minimum of 50 px * 50px
    if (width >= 50 && height >= 50) {
      // Set sizes for future re-renders
      this.size.height = height;
      this.size.width = width;

      // Change the style to match dimensions
      this.div.style.height = `${height}px`;
      this.div.style.width = `${width}px`;
    }
    updateLocalStorage();
  }

  updateText() {
    this.content = this.text.value;
  }

  updateRootStyles(styles) {
    this.rootStyle = styles;
    updateLocalStorage();
  }

  focusMemo() {
    this.text.focus();
  }

}

// Initialize stored memos on page load

localStorageMemos.forEach((memo) => {
  let storedMemo = new Memo(
    memo.id,
    { left: memo.position.left, top: memo.position.top },
    { width: memo.size.width, height: memo.size.height },
    memo.content,
    memo.rootStyle
  );
  memoList.push(storedMemo);
});

// Function used to update local storage if any differences are identified
function updateLocalStorage() {
  if (localStorage.getItem("memos") != JSON.stringify(memoList)) {
    localStorage.setItem("memos", JSON.stringify(memoList));
  }
}

// Global event listeners for memo size and positioning.
window.addEventListener("mousemove", (e) => {
  for (let i = 0; i < memoList.length; i++) {
    if (memoList[i].moving) {
      memoList[i].moveMemo(e);
    }

    if (memoList[i].resizing) {
      memoList[i].resizeMemo(e);
    }
  }
});

window.addEventListener("mouseup", () => {
  for (let i = 0; i < memoList.length; i++) {
    memoList[i].mouseUp();
  }
});

for (const btn of btnList) {
  btn.addEventListener('click', () => changeTheme(btn.id));
}

function changeTheme(btnId) {
  var rs = getComputedStyle(r);
  localStorage.setItem("theme", btnId);

  if (btnId == "btn1") {
    // alert("The value of border is: " + rs.getPropertyValue('--border-color'));
    r.style.setProperty("--border-color", "#FFE27D");
    r.style.setProperty("--memo-bg-color", "#FFE27D29");
  } else if (btnId == "btn2") {
    // alert("The value of border is: " + rs.getPropertyValue('--border-color'));
    r.style.setProperty("--border-color", "#64E3FF");
    r.style.setProperty("--memo-bg-color", "#64E3FF29");
  } else if (btnId == "btn3") {
    // alert("The value of border is: " + rs.getPropertyValue('--border-color'));
    r.style.setProperty("--border-color", "#9042ff");
    r.style.setProperty("--memo-bg-color", "#9042ff29");
  } else if (btnId == "btn4") {
    // alert("The value of border is: " + rs.getPropertyValue('--border-color'));
    r.style.setProperty("--border-color", "#B4FF39");
    r.style.setProperty("--memo-bg-color", "#B4FF3929");
  }

  for (let i = 0; i < memoList.length; i++) {
    memoList[i].updateRootStyles({
      '--border-color': r.style.getPropertyValue('--border-color'),
      '--memo-bg-color': r.style.getPropertyValue('--memo-bg-color'),
    })
  }

  theme = btnId;
}

changeTheme(lsTheme);
