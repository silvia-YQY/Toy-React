import { createElement, Component } from './toy-react'

class MyComponent extends Component {
  constructor() {
    super()
  }
  setAttribute (name, value) {

  }
  appendChild () {

  }
  render () {
    return <div></div>
  }
}


render(<MyComponent id="p" class="c">
  <div>324</div>
  <div></div>
  <div></div>
</MyComponent>)