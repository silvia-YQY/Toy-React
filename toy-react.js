// 利用Symbol设置私有变量
const RENDER_TO_DOM = Symbol("render to dom")

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute (name, value) {
    // 匹配以on开头的属性   [\s\S] 表示匹配所有字符 
    if (name.match(/^on([\s\S]+)/)) {
      // RegExp.$1 表示正则里面的（）匹配语，即事件名称
      // 由于react中on事件使用小驼峰，所以需要把匹配到的事件转为全小写，以免大小写敏感无法绑定时间
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
    } else {
      this.root.setAttribute(name, value);
    }
  }
  appendChild (component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  // 当前class中的私有render函数
  [RENDER_TO_DOM] (range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM] (range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute (name, value) {
    this.props[name] = value;
  }
  appendChild (component) {
    this.children.push(component);
  }
  // this._render  / 私有变量：渲染函数
  [RENDER_TO_DOM] (range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }
  rerender () {
    this._range.deleteContents();
    this[RENDER_TO_DOM](this._range);
  }
  setState (newState) {
    // state初始化
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender();
      return;
    }
    // 合并setState
    let merge = (oldState, newState) => {
      for (let p in newState) {
        // 由于typeof(null) === 'object' , 所以需要单独校验是否object类型
        // js中的巨坑
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          // 若旧数据中不存在，则直接赋值
          oldState[p] = newState[p];
        } else { // 否则递归调用merge
          // 进行深拷贝
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState);
    this.rerender();
  }
}

// jsx 转译成 dom 节点
export function createElement (type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    e = new ElementWrapper(type);
  } else {
    e = new type;
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child);
      }
      if (typeof child === "object" && child instanceof Array) {
        insertChildren(child)
      } else {
        e.appendChild(child);
      }

    }
  }
  insertChildren(children);
  return e;
}

export function render (component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}