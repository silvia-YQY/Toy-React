// 利用Symbol设置私有变量
const RENDER_TO_DOM = Symbol('render to dom');
// 主类
export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  // this._render  / 私有变量：渲染函数
  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom; // 重新render并且得到新的vdom树
    this._vdom[RENDER_TO_DOM](range);
  }
  // vdom 比对
  update() {
    // 节点对比是否相同节点
    let isSameNode = (oldNode, newNode) => {
      // 类型不同
      if (oldNode.type !== newNode.type) return false;
      for (let name in newNode.props) {
        // 属性不同
        if (newNode.props[name] !== oldNode.props[name]) return false;
      }
      // 属性数量不同
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) return false;
      // 文本节点内容不同
      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) return false;
        return true;
      }
    };
    let update = (oldNode, newNode) => {
      // type, props, children
      // 若节点不同，则newNode替换oldNode，重新渲染
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      // 若节点相同，则强行把旧节点赋值给新节点
      newNode._range = oldNode._range;
      //newNode.children 为 component
      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) return;

      // 保存oldChildren最后一个range
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        // newChildren 有可能长于 oldChildren
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          // 创建一个插入的range
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          // newChild 追加到后面
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
          // TODO
        }
      }
    };
    let vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }
  /*
  rerender() {
    // 先保存旧range
    let oldRange = this._range;
    // 先新建一个新的range，插入到当前清空的位置
    // 起终点均为老range的位置
    // 以免清空了range之后，后面相邻的range补上，使得错位
    let newRange = document.createRange();
    newRange.setStart(oldRange.startContainer, oldRange.startOffset);
    newRange.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](newRange);
    // 由于插入 newRange 时，在oldRange的宽度内，所以需要重新设定起点
    oldRange.setStart(newRange.endContainer, newRange.endOffset);
    // 清空当前range
    oldRange.deleteContents();
  }
  */
  setState(newState) {
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
        } else {
          // 否则递归调用merge
          // 进行深拷贝
          merge(oldState[p], newState[p]);
        }
      }
    };
    merge(this.state, newState);
    this.update();
  }
  get vdom() {
    return this.render().vdom;
  }
  // get vchildren() {
  //   return this.children.map((child) => child.vdom);
  // }
}

//创造dom，并代理dom元素的方法
class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
    // this.root = document.createElement(type);
  }
  /*
  // 存this.props.
  setAttribute(name, value) {
    // 匹配以on开头的属性   [\s\S] 表示匹配所有字符
    if (name.match(/^on([\s\S]+)/)) {
      // RegExp.$1 表示正则里面的（）匹配语，即事件名称
      // 由于react中on事件使用小驼峰，所以需要把匹配到的事件转为全小写，以免大小写敏感无法绑定时间
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        value
      );
    } else {
      // 处理className属性
      if (name === 'className') {
        this.root.setAttribute('class', value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
  }
  // 存this.children
  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  */
  // 当前class中的私有render函数
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createElement(this.type);

    for (let name in this.props) {
      // 匹配以on开头的属性   [\s\S] 表示匹配所有字符
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)/)) {
        // RegExp.$1 表示正则里面的（）匹配语，即事件名称
        // 由于react中on事件使用小驼峰，所以需要把匹配到的事件转为全小写，以免大小写敏感无法绑定时间
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          value
        );
      } else {
        // 处理className属性
        if (name === 'className') {
          root.setAttribute('class', value);
        } else {
          root.setAttribute(name, value);
        }
      }
    }

    // 确保this.vchildren存在
    if (!this.vchildren) {
      this.vchildren = this.children.map((child) => child.vdom);
    }

    for (let child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }

    replaceContent(range, root);
  }

  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom);
    return this;
    /*{
      type: this.type,
      props: this.props,
      children: this.children.map((child) => child.vdom),
    };*/
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.content = content;
    this.type = '#text';
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
  get vdom() {
    return this;
    /* {
      type: '#text',
      content: this.content,
    };*/
  }
}

// 处理由于需要更新，导致range置空后，后面的range向前位移的错位现象
function replaceContent(range, node) {
  range.insertNode(node); // 先在range中插入node
  range.setStartAfter(node); // 再把range挪到node之后
  range.deleteContents(node); // 再把range的内容删掉
  range.setStartBefore(node); // 把range设回node之后 ，以免移位
  range.setEndAfter(node);
}

// jsx 转译成 dom 节点
export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === 'string') {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }

  for (let p in attributes) {
    e.setAttribute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child);
      }
      if (child === null) continue;
      if (typeof child === 'object' && child instanceof Array) {
        insertChildren(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChildren(children);
  return e;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
