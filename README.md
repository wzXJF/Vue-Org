# Vue-org
Personal rewrite vue source code, the use of code to achieve the vue of the responsive principle of the analysis


数据劫持：vue.js 则是采用数据劫持结合发布者-订阅者的方式，通过 Object-defineProperty()
来劫持各种属性的 setter 和 getter，在数据变动时，发布消息给依赖收集器，去通知观察者，触发相应的监听回调，
去更新视图

MVVM 作为绑定的入口，整合 Observer，Complie 和 Watcher 三者，通过 Observe 来监听 model 数据变化表，
通过 Complie 来解析编译模板指令，最终利用 Watcher 搭起 Observer，Complie 之间的通讯桥梁，达到数据变化=>
视图更新，视图交互变化=>数据 model 变更的双向绑定效果。