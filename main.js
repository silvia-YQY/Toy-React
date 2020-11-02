const a = 1
for (let i of [1, 2, 3]) {
  console.log(i);
}

// jsx 转译成 dom 节点
function createElement (tagName, attributes, ...children) {
  let e = document.createElement(tagName)
  console.log('createElement', e, tagName, attributes, ...children);
  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  for (let child of children) {
    if (typeof child === 'string') {
      child = document.createTextNode(child);
    }
    e.appendChild(child);
  }
  return e;
}

document.body.appendChild(<div id="p" class="c">
  <div>324</div>
  <div></div>
  <div></div>
</div>)