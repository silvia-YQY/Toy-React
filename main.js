import { createElement, Component, render } from './toy-react'

class MyComponent extends Component {
  constructor() {
    super();
    this.state = {
      a: 1,
      b: 2
    }
  }
  render () {
    return <div>4
      <h1>MyComponent</h1>
      <span>{this.state.b.toString()}</span>
      <span>{this.state.a.toString()}</span>
      {/* 相当于 setState */}
      <button onClick={() => { this.setState({ a: this.state.a + 1 }) }}>add</button>
    </div >
  }
}



render(<MyComponent id="p" class="c">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</MyComponent>, document.body);