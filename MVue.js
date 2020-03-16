const compileUtil = {
  getVal(expr, vm) {
    // console.log(expr.split('.'));  ["person", "name"]
    return expr.split('.').reduce((data, currentVal) => {
      // console.log('aaaa' + JSON.stringify(data[currentVal]));
      return data[currentVal]
    }, vm.$data);
  },
  setVal(expr, vm, inputVal) {
    return expr.split('.').reduce((data, currentVal) => {
      data[currentVal] = inputVal
    }, vm.$data)
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1].trim(), vm)
    })
  },
  text(node, expr, vm) {
    // <div v-text='msg'></div>
    let value
    if (expr.indexOf('{{') !== -1) {
      // {{msg}} ---{{person.name}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], () => {
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })
        return this.getVal(args[1].trim(), vm)
      })
    } else {
      value = this.getVal(expr, vm)
    }
    this.updater.textUpdater(node, value)
  },
  html(node, expr, vm) {
    const val = this.getVal(expr, vm)
    new Watcher(vm, expr, newVal => {
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, val)
  },
  model(node, expr, vm) {
    const val = this.getVal(expr, vm)
    // 绑定更新函数  数据 =>视图
    new Watcher(vm, expr, newVal => {
      this.updater.modelUpdater(node, newVal)
    })
    // 视图 =>数据=>视图
    node.addEventListener('input', e => {
      this.setVal(expr, vm, e.target.value)
    })
    this.updater.modelUpdater(node, val)
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr]
    node.addEventListener(eventName, fn.bind(vm), false)
  },
  // 更新的函数
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    modelUpdater(node, value) {
      node.value = value
    }
  }
}

class Complie {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    if (this.el) {
      // 1.获取文档碎片对象，放入内存中，会减少页面的回流和重绘
      let fragment = this.nodeFragment(this.el)

      // 2.编译模板
      this.complie(fragment)

      // 3.追加子元素到根元素上
      this.el.appendChild(fragment)
    }
  }

  isElementNode(node) {
    return node.nodeType === 1
  }
  nodeFragment(el) {
    el.firstChild
    // 创建一个内存碎片对象
    const fragment = document.createDocumentFragment()
    let firstChild
    while ((firstChild = el.firstChild)) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }

  // 遍历获取并区分元素节点还是文本节点，然后进行相应的处理
  complie(fragment) {
    // 1.获取到每个子节点
    const childNodes = fragment.childNodes
    childNodes.forEach(child => {
      if (this.isElementNode(child)) {
        // 是元素节点
        // 编译元素节点
        this.complieElement(child)
      } else {
        // 文本节点
        // 编译文本节点
        this.complieText(child)
      }

      if (child.childNodes && child.childNodes.length) {
        this.complie(child)
      }
    })
  }
  // 编译元素
  complieElement(node) {
    // <div v-text='msg'></div>
    const attributes = node.attributes
    Array.from(attributes).forEach(attr => {
      const { name, value } = attr
      if (this.isDirective(name)) {
        // 表明是一个指令
        const [, dirctive] = name.split('-')
        const [dirName, eventName] = dirctive.split(':') // text html model on

        /*
          node(整个节点 <div v-text='msg'></div>) 
          value(msg)
          this.vm(相当于整个 MVue实例对象)
          eventName(v-on:click='btnClick') 中的事件名btnClick
        */
        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)

        // 删除有指令的标签上的属性
        node.removeAttribute('v-' + dirctive)
      } else if (this.isEventName(name)) {
        // @click='handleClick'
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      }
    })
  }
  isEventName(eventName) {
    return eventName.startsWith('@')
  }

  // 检测字符串是否以 v- 开头
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }

  // 编译文本
  complieText(node) {
    const content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil['text'](node, content, this.vm)
    }
  }
}

class MVue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$options = options

    if (this.$el) {
      // 1.实现数据的观察者
      new Observer(this.$data)

      // 2.实现指令的解析器
      new Complie(this.$el, this)

      // 做一个代理 可以像vue中那样访问数据 this.person.name 取代这种(this.$data.person.name)
      this.proxyData(this.$data)
    }
  }
  proxyData(data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newVal) {
          data[key] = newVal
        }
      })
    }
  }
}
