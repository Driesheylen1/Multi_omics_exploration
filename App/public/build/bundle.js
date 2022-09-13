
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$2() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$2;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop$2;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$2,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children$1(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$2;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$2) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$2) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop$2;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$2;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop$2;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var noop$1 = {value: () => {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames$1(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames$1(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get$1(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set$1(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    function none() {}

    function selector(selector) {
      return selector == null ? none : function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    // Given something array like (or null), returns something that is strictly an
    // array. This is used to ensure that array-like objects passed to d3.selectAll
    // or selection.selectAll are converted into proper arrays when creating a
    // selection; we don’t ever want to create a selection backed by a live
    // HTMLCollection or NodeList. However, note that selection.selectAll will use a
    // static NodeList as a group, since it safely derived from querySelectorAll.
    function array(x) {
      return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
    }

    function empty$1() {
      return [];
    }

    function selectorAll(selector) {
      return selector == null ? empty$1 : function() {
        return this.querySelectorAll(selector);
      };
    }

    function arrayAll(select) {
      return function() {
        return array(select.apply(this, arguments));
      };
    }

    function selection_selectAll(select) {
      if (typeof select === "function") select = arrayAll(select);
      else select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection$1(subgroups, parents);
    }

    function matcher(selector) {
      return function() {
        return this.matches(selector);
      };
    }

    function childMatcher(selector) {
      return function(node) {
        return node.matches(selector);
      };
    }

    var find$1 = Array.prototype.find;

    function childFind(match) {
      return function() {
        return find$1.call(this.children, match);
      };
    }

    function childFirst() {
      return this.firstElementChild;
    }

    function selection_selectChild(match) {
      return this.select(match == null ? childFirst
          : childFind(typeof match === "function" ? match : childMatcher(match)));
    }

    var filter = Array.prototype.filter;

    function children() {
      return Array.from(this.children);
    }

    function childrenFilter(match) {
      return function() {
        return filter.call(this.children, match);
      };
    }

    function selection_selectChildren(match) {
      return this.selectAll(match == null ? children
          : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function constant$5(x) {
      return function() {
        return x;
      };
    }

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = new Map,
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
          if (nodeByKeyValue.has(keyValue)) {
            exit[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = key.call(parent, data[i], i, data) + "";
        if (node = nodeByKeyValue.get(keyValue)) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue.delete(keyValue);
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
          exit[i] = node;
        }
      }
    }

    function datum(node) {
      return node.__data__;
    }

    function selection_data(value, key) {
      if (!arguments.length) return Array.from(this, datum);

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant$5(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection$1(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    // Given some data, this returns an array-like view of it: an object that
    // exposes a length property and allows numeric indexing. Note that unlike
    // selectAll, this isn’t worried about “live” collections because the resulting
    // array will only be used briefly while data is being bound. (It is possible to
    // cause the data to change while iterating by using a key function, but please
    // don’t; we’d rather avoid a gratuitous copy.)
    function arraylike(data) {
      return typeof data === "object" && "length" in data
        ? data // Array, TypedArray, NodeList, array-like
        : Array.from(data); // Map, Set, iterable, string, or anything else
    }

    function selection_exit() {
      return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_join(onenter, onupdate, onexit) {
      var enter = this.enter(), update = this, exit = this.exit();
      if (typeof onenter === "function") {
        enter = onenter(enter);
        if (enter) enter = enter.selection();
      } else {
        enter = enter.append(onenter + "");
      }
      if (onupdate != null) {
        update = onupdate(update);
        if (update) update = update.selection();
      }
      if (onexit == null) exit.remove(); else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    }

    function selection_merge(context) {
      var selection = context.selection ? context.selection() : context;

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection$1(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending$1;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection$1(sortgroups, this._parents).order();
    }

    function ascending$1(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      return Array.from(this);
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      let size = 0;
      for (const node of this) ++size; // eslint-disable-line no-unused-vars
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove$1(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS$1(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant$1(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS$1(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction$1(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS$1(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
          : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove$1(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant$1(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction$1(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove$1 : typeof value === "function"
                ? styleFunction$1
                : styleConstant$1)(name, value, priority == null ? "" : priority))
          : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return node.style.getPropertyValue(name)
          || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant$1(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction$1(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction$1
              : textConstant$1)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function selection_append(name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function() {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert(name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_cloneShallow() {
      var clone = this.cloneNode(false), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_cloneDeep() {
      var clone = this.cloneNode(true), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    function contextListener(listener) {
      return function(event) {
        listener.call(this, event, this.__data__);
      };
    }

    function parseTypenames(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, options) {
      return function() {
        var on = this.__on, o, listener = contextListener(value);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
            this.addEventListener(o.type, o.listener = listener, o.options = options);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, options);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, options) {
      var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
      return this;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (typeof event === "function") {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    function* selection_iterator() {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) yield node;
        }
      }
    }

    var root = [null];

    function Selection$1(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection$1([[document.documentElement]], root);
    }

    function selection_selection() {
      return this;
    }

    Selection$1.prototype = selection.prototype = {
      constructor: Selection$1,
      select: selection_select,
      selectAll: selection_selectAll,
      selectChild: selection_selectChild,
      selectChildren: selection_selectChildren,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      join: selection_join,
      merge: selection_merge,
      selection: selection_selection,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      clone: selection_clone,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch,
      [Symbol.iterator]: selection_iterator
    };

    function select(selector) {
      return typeof selector === "string"
          ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
          : new Selection$1([[selector]], root);
    }

    function sourceEvent(event) {
      let sourceEvent;
      while (sourceEvent = event.sourceEvent) event = sourceEvent;
      return event;
    }

    function pointer(event, node) {
      event = sourceEvent(event);
      if (node === undefined) node = event.currentTarget;
      if (node) {
        var svg = node.ownerSVGElement || node;
        if (svg.createSVGPoint) {
          var point = svg.createSVGPoint();
          point.x = event.clientX, point.y = event.clientY;
          point = point.matrixTransform(node.getScreenCTM().inverse());
          return [point.x, point.y];
        }
        if (node.getBoundingClientRect) {
          var rect = node.getBoundingClientRect();
          return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
        }
      }
      return [event.pageX, event.pageY];
    }

    // These are typically used in conjunction with noevent to ensure that we can
    // preventDefault on the event.
    const nonpassive = {passive: false};
    const nonpassivecapture = {capture: true, passive: false};

    function nopropagation$2(event) {
      event.stopImmediatePropagation();
    }

    function noevent$2(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function dragDisable(view) {
      var root = view.document.documentElement,
          selection = select(view).on("dragstart.drag", noevent$2, nonpassivecapture);
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", noevent$2, nonpassivecapture);
      } else {
        root.__noselect = root.style.MozUserSelect;
        root.style.MozUserSelect = "none";
      }
    }

    function yesdrag(view, noclick) {
      var root = view.document.documentElement,
          selection = select(view).on("dragstart.drag", null);
      if (noclick) {
        selection.on("click.drag", noevent$2, nonpassivecapture);
        setTimeout(function() { selection.on("click.drag", null); }, 0);
      }
      if ("onselectstart" in root) {
        selection.on("selectstart.drag", null);
      } else {
        root.style.MozUserSelect = root.__noselect;
        delete root.__noselect;
      }
    }

    var constant$4 = x => () => x;

    function DragEvent(type, {
      sourceEvent,
      subject,
      target,
      identifier,
      active,
      x, y, dx, dy,
      dispatch
    }) {
      Object.defineProperties(this, {
        type: {value: type, enumerable: true, configurable: true},
        sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
        subject: {value: subject, enumerable: true, configurable: true},
        target: {value: target, enumerable: true, configurable: true},
        identifier: {value: identifier, enumerable: true, configurable: true},
        active: {value: active, enumerable: true, configurable: true},
        x: {value: x, enumerable: true, configurable: true},
        y: {value: y, enumerable: true, configurable: true},
        dx: {value: dx, enumerable: true, configurable: true},
        dy: {value: dy, enumerable: true, configurable: true},
        _: {value: dispatch}
      });
    }

    DragEvent.prototype.on = function() {
      var value = this._.on.apply(this._, arguments);
      return value === this._ ? this : value;
    };

    // Ignore right-click, since that should open the context menu.
    function defaultFilter$2(event) {
      return !event.ctrlKey && !event.button;
    }

    function defaultContainer() {
      return this.parentNode;
    }

    function defaultSubject(event, d) {
      return d == null ? {x: event.x, y: event.y} : d;
    }

    function defaultTouchable$2() {
      return navigator.maxTouchPoints || ("ontouchstart" in this);
    }

    function drag() {
      var filter = defaultFilter$2,
          container = defaultContainer,
          subject = defaultSubject,
          touchable = defaultTouchable$2,
          gestures = {},
          listeners = dispatch("start", "drag", "end"),
          active = 0,
          mousedownx,
          mousedowny,
          mousemoving,
          touchending,
          clickDistance2 = 0;

      function drag(selection) {
        selection
            .on("mousedown.drag", mousedowned)
          .filter(touchable)
            .on("touchstart.drag", touchstarted)
            .on("touchmove.drag", touchmoved, nonpassive)
            .on("touchend.drag touchcancel.drag", touchended)
            .style("touch-action", "none")
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
      }

      function mousedowned(event, d) {
        if (touchending || !filter.call(this, event, d)) return;
        var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
        if (!gesture) return;
        select(event.view)
          .on("mousemove.drag", mousemoved, nonpassivecapture)
          .on("mouseup.drag", mouseupped, nonpassivecapture);
        dragDisable(event.view);
        nopropagation$2(event);
        mousemoving = false;
        mousedownx = event.clientX;
        mousedowny = event.clientY;
        gesture("start", event);
      }

      function mousemoved(event) {
        noevent$2(event);
        if (!mousemoving) {
          var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
          mousemoving = dx * dx + dy * dy > clickDistance2;
        }
        gestures.mouse("drag", event);
      }

      function mouseupped(event) {
        select(event.view).on("mousemove.drag mouseup.drag", null);
        yesdrag(event.view, mousemoving);
        noevent$2(event);
        gestures.mouse("end", event);
      }

      function touchstarted(event, d) {
        if (!filter.call(this, event, d)) return;
        var touches = event.changedTouches,
            c = container.call(this, event, d),
            n = touches.length, i, gesture;

        for (i = 0; i < n; ++i) {
          if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
            nopropagation$2(event);
            gesture("start", event, touches[i]);
          }
        }
      }

      function touchmoved(event) {
        var touches = event.changedTouches,
            n = touches.length, i, gesture;

        for (i = 0; i < n; ++i) {
          if (gesture = gestures[touches[i].identifier]) {
            noevent$2(event);
            gesture("drag", event, touches[i]);
          }
        }
      }

      function touchended(event) {
        var touches = event.changedTouches,
            n = touches.length, i, gesture;

        if (touchending) clearTimeout(touchending);
        touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
        for (i = 0; i < n; ++i) {
          if (gesture = gestures[touches[i].identifier]) {
            nopropagation$2(event);
            gesture("end", event, touches[i]);
          }
        }
      }

      function beforestart(that, container, event, d, identifier, touch) {
        var dispatch = listeners.copy(),
            p = pointer(touch || event, container), dx, dy,
            s;

        if ((s = subject.call(that, new DragEvent("beforestart", {
            sourceEvent: event,
            target: drag,
            identifier,
            active,
            x: p[0],
            y: p[1],
            dx: 0,
            dy: 0,
            dispatch
          }), d)) == null) return;

        dx = s.x - p[0] || 0;
        dy = s.y - p[1] || 0;

        return function gesture(type, event, touch) {
          var p0 = p, n;
          switch (type) {
            case "start": gestures[identifier] = gesture, n = active++; break;
            case "end": delete gestures[identifier], --active; // falls through
            case "drag": p = pointer(touch || event, container), n = active; break;
          }
          dispatch.call(
            type,
            that,
            new DragEvent(type, {
              sourceEvent: event,
              subject: s,
              target: drag,
              identifier,
              active: n,
              x: p[0] + dx,
              y: p[1] + dy,
              dx: p[0] - p0[0],
              dy: p[1] - p0[1],
              dispatch
            }),
            d
          );
        };
      }

      drag.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$4(!!_), drag) : filter;
      };

      drag.container = function(_) {
        return arguments.length ? (container = typeof _ === "function" ? _ : constant$4(_), drag) : container;
      };

      drag.subject = function(_) {
        return arguments.length ? (subject = typeof _ === "function" ? _ : constant$4(_), drag) : subject;
      };

      drag.touchable = function(_) {
        return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$4(!!_), drag) : touchable;
      };

      drag.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? drag : value;
      };

      drag.clickDistance = function(_) {
        return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
      };

      return drag;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    function basis(t1, v0, v1, v2, v3) {
      var t2 = t1 * t1, t3 = t2 * t1;
      return ((1 - 3 * t1 + 3 * t2 - t3) * v0
          + (4 - 6 * t2 + 3 * t3) * v1
          + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
          + t3 * v3) / 6;
    }

    function basis$1(values) {
      var n = values.length - 1;
      return function(t) {
        var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
            v1 = values[i],
            v2 = values[i + 1],
            v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
            v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
        return basis((t - i / n) * n, v0, v1, v2, v3);
      };
    }

    var constant$3 = x => () => x;

    function linear$1(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant$3(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear$1(a, d) : constant$3(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function rgbSpline(spline) {
      return function(colors) {
        var n = colors.length,
            r = new Array(n),
            g = new Array(n),
            b = new Array(n),
            i, color;
        for (i = 0; i < n; ++i) {
          color = rgb(colors[i]);
          r[i] = color.r || 0;
          g[i] = color.g || 0;
          b[i] = color.b || 0;
        }
        r = spline(r);
        g = spline(g);
        b = spline(b);
        color.opacity = 1;
        return function(t) {
          color.r = r(t);
          color.g = g(t);
          color.b = b(t);
          return color + "";
        };
      };
    }

    var rgbBasis = rgbSpline(basis$1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolate$1(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolate$1(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant$3(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    var degrees = 180 / Math.PI;

    var identity$3 = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };

    function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
      if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
      if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
      if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY
      };
    }

    var svgNode;

    /* eslint-disable no-undef */
    function parseCss(value) {
      const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
      return m.isIdentity ? identity$3 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    function parseSvg(value) {
      if (value == null) return identity$3;
      if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svgNode.setAttribute("transform", value);
      if (!(value = svgNode.transform.baseVal.consolidate())) return identity$3;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    }

    function interpolateTransform(parse, pxComma, pxParen, degParen) {

      function pop(s) {
        return s.length ? s.pop() + " " : "";
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push("translate(", null, pxComma, null, pxParen);
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb || yb) {
          s.push("translate(" + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
          q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "rotate(" + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "skewX(" + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + "scale(", null, ",", null, ")");
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + "scale(" + xb + "," + yb + ")");
        }
      }

      return function(a, b) {
        var s = [], // string constants and placeholders
            q = []; // number interpolators
        a = parse(a), b = parse(b);
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function(t) {
          var i = -1, n = q.length, o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

    var epsilon2 = 1e-12;

    function cosh(x) {
      return ((x = Math.exp(x)) + 1 / x) / 2;
    }

    function sinh(x) {
      return ((x = Math.exp(x)) - 1 / x) / 2;
    }

    function tanh(x) {
      return ((x = Math.exp(2 * x)) - 1) / (x + 1);
    }

    var interpolateZoom = (function zoomRho(rho, rho2, rho4) {

      // p0 = [ux0, uy0, w0]
      // p1 = [ux1, uy1, w1]
      function zoom(p0, p1) {
        var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
            ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
            dx = ux1 - ux0,
            dy = uy1 - uy0,
            d2 = dx * dx + dy * dy,
            i,
            S;

        // Special case for u0 ≅ u1.
        if (d2 < epsilon2) {
          S = Math.log(w1 / w0) / rho;
          i = function(t) {
            return [
              ux0 + t * dx,
              uy0 + t * dy,
              w0 * Math.exp(rho * t * S)
            ];
          };
        }

        // General case.
        else {
          var d1 = Math.sqrt(d2),
              b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
              b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
              r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
              r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
          S = (r1 - r0) / rho;
          i = function(t) {
            var s = t * S,
                coshr0 = cosh(r0),
                u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
            return [
              ux0 + u * dx,
              uy0 + u * dy,
              w0 * coshr0 / cosh(rho * s + r0)
            ];
          };
        }

        i.duration = S * 1000 * rho / Math.SQRT2;

        return i;
      }

      zoom.rho = function(_) {
        var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
        return zoomRho(_1, _2, _4);
      };

      return zoom;
    })(Math.SQRT2, 2, 4);

    function piecewise(interpolate, values) {
      if (values === undefined) values = interpolate, interpolate = interpolate$1;
      var i = 0, n = values.length - 1, v = values[0], I = new Array(n < 0 ? 0 : n);
      while (i < n) I[i] = interpolate(v, v = values[++i]);
      return function(t) {
        var i = Math.max(0, Math.min(n - 1, Math.floor(t *= n)));
        return I[i](t - i);
      };
    }

    var frame = 0, // is an animation frame pending?
        timeout$1 = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout$1 = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout$1) timeout$1 = clearTimeout(timeout$1);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    function timeout(callback, delay, time) {
      var t = new Timer;
      delay = delay == null ? 0 : +delay;
      t.restart(elapsed => {
        t.stop();
        callback(elapsed + delay);
      }, delay, time);
      return t;
    }

    var emptyOn = dispatch("start", "end", "cancel", "interrupt");
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    function schedule(node, name, id, index, group, timing) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED
      });
    }

    function init(node, id) {
      var schedule = get(node, id);
      if (schedule.state > CREATED) throw new Error("too late; already scheduled");
      return schedule;
    }

    function set(node, id) {
      var schedule = get(node, id);
      if (schedule.state > STARTED) throw new Error("too late; already running");
      return schedule;
    }

    function get(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
          tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return timeout(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("interrupt", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("cancel", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        timeout(function() {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call("start", node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array(n = self.tween.length);
        for (i = 0, j = -1; i < n; ++i) {
          if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
            i = -1,
            n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call("end", node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    }

    function interrupt(node, name) {
      var schedules = node.__transition,
          schedule,
          active,
          empty = true,
          i;

      if (!schedules) return;

      name = name == null ? null : name + "";

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    }

    function selection_interrupt(name) {
      return this.each(function() {
        interrupt(this, name);
      });
    }

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== "function") throw new Error;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    function transition_tween(name, value) {
      var id = this._id;

      name += "";

      if (arguments.length < 2) {
        var tween = get(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function() {
        var schedule = set(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
      });

      return function(node) {
        return get(node, id).value[name];
      };
    }

    function interpolate(a, b) {
      var c;
      return (typeof b === "number" ? interpolateNumber
          : b instanceof color ? interpolateRgb
          : (c = color(b)) ? (b = c, interpolateRgb)
          : interpolateString)(a, b);
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttribute(name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrConstantNS(fullname, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function attrFunctionNS(fullname, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function transition_attr(name, value) {
      var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
      return this.attrTween(name, typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
          : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
          : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
    }

    function attrInterpolate(name, i) {
      return function(t) {
        this.setAttribute(name, i.call(this, t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function(t) {
        this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_attrTween(name, value) {
      var key = "attr." + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      var fullname = namespace(name);
      return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
    }

    function delayFunction(id, value) {
      return function() {
        init(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return value = +value, function() {
        init(this, id).delay = value;
      };
    }

    function transition_delay(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? delayFunction
              : delayConstant)(id, value))
          : get(this.node(), id).delay;
    }

    function durationFunction(id, value) {
      return function() {
        set(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return value = +value, function() {
        set(this, id).duration = value;
      };
    }

    function transition_duration(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? durationFunction
              : durationConstant)(id, value))
          : get(this.node(), id).duration;
    }

    function easeConstant(id, value) {
      if (typeof value !== "function") throw new Error;
      return function() {
        set(this, id).ease = value;
      };
    }

    function transition_ease(value) {
      var id = this._id;

      return arguments.length
          ? this.each(easeConstant(id, value))
          : get(this.node(), id).ease;
    }

    function easeVarying(id, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (typeof v !== "function") throw new Error;
        set(this, id).ease = v;
      };
    }

    function transition_easeVarying(value) {
      if (typeof value !== "function") throw new Error;
      return this.each(easeVarying(this._id, value));
    }

    function transition_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    }

    function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error;

      for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    }

    function start$1(name) {
      return (name + "").trim().split(/^|\s+/).every(function(t) {
        var i = t.indexOf(".");
        if (i >= 0) t = t.slice(0, i);
        return !t || t === "start";
      });
    }

    function onFunction(id, name, listener) {
      var on0, on1, sit = start$1(name) ? init : set;
      return function() {
        var schedule = sit(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
          ? get(this.node(), id).on.on(name)
          : this.each(onFunction(id, name, listener));
    }

    function removeFunction(id) {
      return function() {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    function transition_remove() {
      return this.on("end.remove", removeFunction(this._id));
    }

    function transition_select(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(subgroup[i], name, id, i, subgroup, get(node, id));
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    }

    function transition_selectAll(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
              if (child = children[k]) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    }

    var Selection = selection.prototype.constructor;

    function transition_selection() {
      return new Selection(this._groups, this._parents);
    }

    function styleNull(name, interpolate) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, string10 = string1);
      };
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = styleValue(this, name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function styleFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            value1 = value(this),
            string1 = value1 + "";
        if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
      return function() {
        var schedule = set(this, id),
            on = schedule.on,
            listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

        schedule.on = on1;
      };
    }

    function transition_style(name, value, priority) {
      var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
      return value == null ? this
          .styleTween(name, styleNull(name, i))
          .on("end.style." + name, styleRemove(name))
        : typeof value === "function" ? this
          .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
          .each(styleMaybeRemove(this._id, name))
        : this
          .styleTween(name, styleConstant(name, i, value), priority)
          .on("end.style." + name, null);
    }

    function styleInterpolate(name, i, priority) {
      return function(t) {
        this.style.setProperty(name, i.call(this, t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    function transition_styleTween(name, value, priority) {
      var key = "style." + (name += "");
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var value1 = value(this);
        this.textContent = value1 == null ? "" : value1;
      };
    }

    function transition_text(value) {
      return this.tween("text", typeof value === "function"
          ? textFunction(tweenValue(this, "text", value))
          : textConstant(value == null ? "" : value + ""));
    }

    function textInterpolate(i) {
      return function(t) {
        this.textContent = i.call(this, t);
      };
    }

    function textTween(value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_textTween(value) {
      var key = "text";
      if (arguments.length < 1) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, textTween(value));
    }

    function transition_transition() {
      var name = this._name,
          id0 = this._id,
          id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            var inherit = get(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    }

    function transition_end() {
      var on0, on1, that = this, id = that._id, size = that.size();
      return new Promise(function(resolve, reject) {
        var cancel = {value: reject},
            end = {value: function() { if (--size === 0) resolve(); }};

        that.each(function() {
          var schedule = set(this, id),
              on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });

        // The selection was empty, resolve end immediately
        if (size === 0) resolve();
      });
    }

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = selection.prototype;

    Transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      selectChild: selection_prototype.selectChild,
      selectChildren: selection_prototype.selectChildren,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition_transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      textTween: transition_textTween,
      remove: transition_remove,
      tween: transition_tween,
      delay: transition_delay,
      duration: transition_duration,
      ease: transition_ease,
      easeVarying: transition_easeVarying,
      end: transition_end,
      [Symbol.iterator]: selection_prototype[Symbol.iterator]
    };

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    }

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          throw new Error(`transition ${id} not found`);
        }
      }
      return timing;
    }

    function selection_transition(name) {
      var id,
          timing;

      if (name instanceof Transition) {
        id = name._id, name = name._name;
      } else {
        id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    }

    selection.prototype.interrupt = selection_interrupt;
    selection.prototype.transition = selection_transition;

    var constant$2 = x => () => x;

    function ZoomEvent(type, {
      sourceEvent,
      target,
      transform,
      dispatch
    }) {
      Object.defineProperties(this, {
        type: {value: type, enumerable: true, configurable: true},
        sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
        target: {value: target, enumerable: true, configurable: true},
        transform: {value: transform, enumerable: true, configurable: true},
        _: {value: dispatch}
      });
    }

    function Transform(k, x, y) {
      this.k = k;
      this.x = x;
      this.y = y;
    }

    Transform.prototype = {
      constructor: Transform,
      scale: function(k) {
        return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
      },
      translate: function(x, y) {
        return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
      },
      apply: function(point) {
        return [point[0] * this.k + this.x, point[1] * this.k + this.y];
      },
      applyX: function(x) {
        return x * this.k + this.x;
      },
      applyY: function(y) {
        return y * this.k + this.y;
      },
      invert: function(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
      },
      invertX: function(x) {
        return (x - this.x) / this.k;
      },
      invertY: function(y) {
        return (y - this.y) / this.k;
      },
      rescaleX: function(x) {
        return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
      },
      rescaleY: function(y) {
        return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
      },
      toString: function() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
      }
    };

    var identity$2 = new Transform(1, 0, 0);

    function nopropagation$1(event) {
      event.stopImmediatePropagation();
    }

    function noevent$1(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    // Ignore right-click, since that should open the context menu.
    // except for pinch-to-zoom, which is sent as a wheel+ctrlKey event
    function defaultFilter$1(event) {
      return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    }

    function defaultExtent$1() {
      var e = this;
      if (e instanceof SVGElement) {
        e = e.ownerSVGElement || e;
        if (e.hasAttribute("viewBox")) {
          e = e.viewBox.baseVal;
          return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
        }
        return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
      }
      return [[0, 0], [e.clientWidth, e.clientHeight]];
    }

    function defaultTransform() {
      return this.__zoom || identity$2;
    }

    function defaultWheelDelta(event) {
      return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
    }

    function defaultTouchable$1() {
      return navigator.maxTouchPoints || ("ontouchstart" in this);
    }

    function defaultConstrain(transform, extent, translateExtent) {
      var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
          dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
          dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
          dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
      return transform.translate(
        dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
        dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
      );
    }

    function zoom() {
      var filter = defaultFilter$1,
          extent = defaultExtent$1,
          constrain = defaultConstrain,
          wheelDelta = defaultWheelDelta,
          touchable = defaultTouchable$1,
          scaleExtent = [0, Infinity],
          translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
          duration = 250,
          interpolate = interpolateZoom,
          listeners = dispatch("start", "zoom", "end"),
          touchstarting,
          touchfirst,
          touchending,
          touchDelay = 500,
          wheelDelay = 150,
          clickDistance2 = 0,
          tapDistance = 10;

      function zoom(selection) {
        selection
            .property("__zoom", defaultTransform)
            .on("wheel.zoom", wheeled, {passive: false})
            .on("mousedown.zoom", mousedowned)
            .on("dblclick.zoom", dblclicked)
          .filter(touchable)
            .on("touchstart.zoom", touchstarted)
            .on("touchmove.zoom", touchmoved)
            .on("touchend.zoom touchcancel.zoom", touchended)
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
      }

      zoom.transform = function(collection, transform, point, event) {
        var selection = collection.selection ? collection.selection() : collection;
        selection.property("__zoom", defaultTransform);
        if (collection !== selection) {
          schedule(collection, transform, point, event);
        } else {
          selection.interrupt().each(function() {
            gesture(this, arguments)
              .event(event)
              .start()
              .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
              .end();
          });
        }
      };

      zoom.scaleBy = function(selection, k, p, event) {
        zoom.scaleTo(selection, function() {
          var k0 = this.__zoom.k,
              k1 = typeof k === "function" ? k.apply(this, arguments) : k;
          return k0 * k1;
        }, p, event);
      };

      zoom.scaleTo = function(selection, k, p, event) {
        zoom.transform(selection, function() {
          var e = extent.apply(this, arguments),
              t0 = this.__zoom,
              p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
              p1 = t0.invert(p0),
              k1 = typeof k === "function" ? k.apply(this, arguments) : k;
          return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
        }, p, event);
      };

      zoom.translateBy = function(selection, x, y, event) {
        zoom.transform(selection, function() {
          return constrain(this.__zoom.translate(
            typeof x === "function" ? x.apply(this, arguments) : x,
            typeof y === "function" ? y.apply(this, arguments) : y
          ), extent.apply(this, arguments), translateExtent);
        }, null, event);
      };

      zoom.translateTo = function(selection, x, y, p, event) {
        zoom.transform(selection, function() {
          var e = extent.apply(this, arguments),
              t = this.__zoom,
              p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
          return constrain(identity$2.translate(p0[0], p0[1]).scale(t.k).translate(
            typeof x === "function" ? -x.apply(this, arguments) : -x,
            typeof y === "function" ? -y.apply(this, arguments) : -y
          ), e, translateExtent);
        }, p, event);
      };

      function scale(transform, k) {
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
        return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
      }

      function translate(transform, p0, p1) {
        var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
        return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
      }

      function centroid(extent) {
        return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
      }

      function schedule(transition, transform, point, event) {
        transition
            .on("start.zoom", function() { gesture(this, arguments).event(event).start(); })
            .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).event(event).end(); })
            .tween("zoom", function() {
              var that = this,
                  args = arguments,
                  g = gesture(that, args).event(event),
                  e = extent.apply(that, args),
                  p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
                  w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
                  a = that.__zoom,
                  b = typeof transform === "function" ? transform.apply(that, args) : transform,
                  i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
              return function(t) {
                if (t === 1) t = b; // Avoid rounding error on end.
                else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
                g.zoom(null, t);
              };
            });
      }

      function gesture(that, args, clean) {
        return (!clean && that.__zooming) || new Gesture(that, args);
      }

      function Gesture(that, args) {
        this.that = that;
        this.args = args;
        this.active = 0;
        this.sourceEvent = null;
        this.extent = extent.apply(that, args);
        this.taps = 0;
      }

      Gesture.prototype = {
        event: function(event) {
          if (event) this.sourceEvent = event;
          return this;
        },
        start: function() {
          if (++this.active === 1) {
            this.that.__zooming = this;
            this.emit("start");
          }
          return this;
        },
        zoom: function(key, transform) {
          if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
          if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
          if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
          this.that.__zoom = transform;
          this.emit("zoom");
          return this;
        },
        end: function() {
          if (--this.active === 0) {
            delete this.that.__zooming;
            this.emit("end");
          }
          return this;
        },
        emit: function(type) {
          var d = select(this.that).datum();
          listeners.call(
            type,
            this.that,
            new ZoomEvent(type, {
              sourceEvent: this.sourceEvent,
              target: zoom,
              type,
              transform: this.that.__zoom,
              dispatch: listeners
            }),
            d
          );
        }
      };

      function wheeled(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var g = gesture(this, args).event(event),
            t = this.__zoom,
            k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
            p = pointer(event);

        // If the mouse is in the same location as before, reuse it.
        // If there were recent wheel events, reset the wheel idle timeout.
        if (g.wheel) {
          if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
            g.mouse[1] = t.invert(g.mouse[0] = p);
          }
          clearTimeout(g.wheel);
        }

        // If this wheel event won’t trigger a transform change, ignore it.
        else if (t.k === k) return;

        // Otherwise, capture the mouse point and location at the start.
        else {
          g.mouse = [p, t.invert(p)];
          interrupt(this);
          g.start();
        }

        noevent$1(event);
        g.wheel = setTimeout(wheelidled, wheelDelay);
        g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

        function wheelidled() {
          g.wheel = null;
          g.end();
        }
      }

      function mousedowned(event, ...args) {
        if (touchending || !filter.apply(this, arguments)) return;
        var currentTarget = event.currentTarget,
            g = gesture(this, args, true).event(event),
            v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
            p = pointer(event, currentTarget),
            x0 = event.clientX,
            y0 = event.clientY;

        dragDisable(event.view);
        nopropagation$1(event);
        g.mouse = [p, this.__zoom.invert(p)];
        interrupt(this);
        g.start();

        function mousemoved(event) {
          noevent$1(event);
          if (!g.moved) {
            var dx = event.clientX - x0, dy = event.clientY - y0;
            g.moved = dx * dx + dy * dy > clickDistance2;
          }
          g.event(event)
           .zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
        }

        function mouseupped(event) {
          v.on("mousemove.zoom mouseup.zoom", null);
          yesdrag(event.view, g.moved);
          noevent$1(event);
          g.event(event).end();
        }
      }

      function dblclicked(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var t0 = this.__zoom,
            p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this),
            p1 = t0.invert(p0),
            k1 = t0.k * (event.shiftKey ? 0.5 : 2),
            t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);

        noevent$1(event);
        if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0, event);
        else select(this).call(zoom.transform, t1, p0, event);
      }

      function touchstarted(event, ...args) {
        if (!filter.apply(this, arguments)) return;
        var touches = event.touches,
            n = touches.length,
            g = gesture(this, args, event.changedTouches.length === n).event(event),
            started, i, t, p;

        nopropagation$1(event);
        for (i = 0; i < n; ++i) {
          t = touches[i], p = pointer(t, this);
          p = [p, this.__zoom.invert(p), t.identifier];
          if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
          else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
        }

        if (touchstarting) touchstarting = clearTimeout(touchstarting);

        if (started) {
          if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
          interrupt(this);
          g.start();
        }
      }

      function touchmoved(event, ...args) {
        if (!this.__zooming) return;
        var g = gesture(this, args).event(event),
            touches = event.changedTouches,
            n = touches.length, i, t, p, l;

        noevent$1(event);
        for (i = 0; i < n; ++i) {
          t = touches[i], p = pointer(t, this);
          if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
          else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
        }
        t = g.that.__zoom;
        if (g.touch1) {
          var p0 = g.touch0[0], l0 = g.touch0[1],
              p1 = g.touch1[0], l1 = g.touch1[1],
              dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
              dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
          t = scale(t, Math.sqrt(dp / dl));
          p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
          l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
        }
        else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
        else return;

        g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
      }

      function touchended(event, ...args) {
        if (!this.__zooming) return;
        var g = gesture(this, args).event(event),
            touches = event.changedTouches,
            n = touches.length, i, t;

        nopropagation$1(event);
        if (touchending) clearTimeout(touchending);
        touchending = setTimeout(function() { touchending = null; }, touchDelay);
        for (i = 0; i < n; ++i) {
          t = touches[i];
          if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
          else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
        }
        if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
        if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
        else {
          g.end();
          // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
          if (g.taps === 2) {
            t = pointer(t, this);
            if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
              var p = select(this).on("dblclick.zoom");
              if (p) p.apply(this, arguments);
            }
          }
        }
      }

      zoom.wheelDelta = function(_) {
        return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant$2(+_), zoom) : wheelDelta;
      };

      zoom.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$2(!!_), zoom) : filter;
      };

      zoom.touchable = function(_) {
        return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$2(!!_), zoom) : touchable;
      };

      zoom.extent = function(_) {
        return arguments.length ? (extent = typeof _ === "function" ? _ : constant$2([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
      };

      zoom.scaleExtent = function(_) {
        return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
      };

      zoom.translateExtent = function(_) {
        return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
      };

      zoom.constrain = function(_) {
        return arguments.length ? (constrain = _, zoom) : constrain;
      };

      zoom.duration = function(_) {
        return arguments.length ? (duration = +_, zoom) : duration;
      };

      zoom.interpolate = function(_) {
        return arguments.length ? (interpolate = _, zoom) : interpolate;
      };

      zoom.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? zoom : value;
      };

      zoom.clickDistance = function(_) {
        return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
      };

      zoom.tapDistance = function(_) {
        return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
      };

      return zoom;
    }

    var constant$1 = x => () => x;

    function BrushEvent(type, {
      sourceEvent,
      target,
      selection,
      mode,
      dispatch
    }) {
      Object.defineProperties(this, {
        type: {value: type, enumerable: true, configurable: true},
        sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
        target: {value: target, enumerable: true, configurable: true},
        selection: {value: selection, enumerable: true, configurable: true},
        mode: {value: mode, enumerable: true, configurable: true},
        _: {value: dispatch}
      });
    }

    function nopropagation(event) {
      event.stopImmediatePropagation();
    }

    function noevent(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    var MODE_DRAG = {name: "drag"},
        MODE_SPACE = {name: "space"},
        MODE_HANDLE = {name: "handle"},
        MODE_CENTER = {name: "center"};

    const {abs, max: max$2, min: min$2} = Math;

    function number1(e) {
      return [+e[0], +e[1]];
    }

    function number2(e) {
      return [number1(e[0]), number1(e[1])];
    }

    var X = {
      name: "x",
      handles: ["w", "e"].map(type),
      input: function(x, e) { return x == null ? null : [[+x[0], e[0][1]], [+x[1], e[1][1]]]; },
      output: function(xy) { return xy && [xy[0][0], xy[1][0]]; }
    };

    var Y = {
      name: "y",
      handles: ["n", "s"].map(type),
      input: function(y, e) { return y == null ? null : [[e[0][0], +y[0]], [e[1][0], +y[1]]]; },
      output: function(xy) { return xy && [xy[0][1], xy[1][1]]; }
    };

    var XY = {
      name: "xy",
      handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
      input: function(xy) { return xy == null ? null : number2(xy); },
      output: function(xy) { return xy; }
    };

    var cursors = {
      overlay: "crosshair",
      selection: "move",
      n: "ns-resize",
      e: "ew-resize",
      s: "ns-resize",
      w: "ew-resize",
      nw: "nwse-resize",
      ne: "nesw-resize",
      se: "nwse-resize",
      sw: "nesw-resize"
    };

    var flipX = {
      e: "w",
      w: "e",
      nw: "ne",
      ne: "nw",
      se: "sw",
      sw: "se"
    };

    var flipY = {
      n: "s",
      s: "n",
      nw: "sw",
      ne: "se",
      se: "ne",
      sw: "nw"
    };

    var signsX = {
      overlay: +1,
      selection: +1,
      n: null,
      e: +1,
      s: null,
      w: -1,
      nw: -1,
      ne: +1,
      se: +1,
      sw: -1
    };

    var signsY = {
      overlay: +1,
      selection: +1,
      n: -1,
      e: null,
      s: +1,
      w: null,
      nw: -1,
      ne: -1,
      se: +1,
      sw: +1
    };

    function type(t) {
      return {type: t};
    }

    // Ignore right-click, since that should open the context menu.
    function defaultFilter(event) {
      return !event.ctrlKey && !event.button;
    }

    function defaultExtent() {
      var svg = this.ownerSVGElement || this;
      if (svg.hasAttribute("viewBox")) {
        svg = svg.viewBox.baseVal;
        return [[svg.x, svg.y], [svg.x + svg.width, svg.y + svg.height]];
      }
      return [[0, 0], [svg.width.baseVal.value, svg.height.baseVal.value]];
    }

    function defaultTouchable() {
      return navigator.maxTouchPoints || ("ontouchstart" in this);
    }

    // Like d3.local, but with the name “__brush” rather than auto-generated.
    function local(node) {
      while (!node.__brush) if (!(node = node.parentNode)) return;
      return node.__brush;
    }

    function empty(extent) {
      return extent[0][0] === extent[1][0]
          || extent[0][1] === extent[1][1];
    }

    function brush() {
      return brush$1(XY);
    }

    function brush$1(dim) {
      var extent = defaultExtent,
          filter = defaultFilter,
          touchable = defaultTouchable,
          keys = true,
          listeners = dispatch("start", "brush", "end"),
          handleSize = 6,
          touchending;

      function brush(group) {
        var overlay = group
            .property("__brush", initialize)
          .selectAll(".overlay")
          .data([type("overlay")]);

        overlay.enter().append("rect")
            .attr("class", "overlay")
            .attr("pointer-events", "all")
            .attr("cursor", cursors.overlay)
          .merge(overlay)
            .each(function() {
              var extent = local(this).extent;
              select(this)
                  .attr("x", extent[0][0])
                  .attr("y", extent[0][1])
                  .attr("width", extent[1][0] - extent[0][0])
                  .attr("height", extent[1][1] - extent[0][1]);
            });

        group.selectAll(".selection")
          .data([type("selection")])
          .enter().append("rect")
            .attr("class", "selection")
            .attr("cursor", cursors.selection)
            .attr("fill", "#777")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#fff")
            .attr("shape-rendering", "crispEdges");

        var handle = group.selectAll(".handle")
          .data(dim.handles, function(d) { return d.type; });

        handle.exit().remove();

        handle.enter().append("rect")
            .attr("class", function(d) { return "handle handle--" + d.type; })
            .attr("cursor", function(d) { return cursors[d.type]; });

        group
            .each(redraw)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousedown.brush", started)
          .filter(touchable)
            .on("touchstart.brush", started)
            .on("touchmove.brush", touchmoved)
            .on("touchend.brush touchcancel.brush", touchended)
            .style("touch-action", "none")
            .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
      }

      brush.move = function(group, selection, event) {
        if (group.tween) {
          group
              .on("start.brush", function(event) { emitter(this, arguments).beforestart().start(event); })
              .on("interrupt.brush end.brush", function(event) { emitter(this, arguments).end(event); })
              .tween("brush", function() {
                var that = this,
                    state = that.__brush,
                    emit = emitter(that, arguments),
                    selection0 = state.selection,
                    selection1 = dim.input(typeof selection === "function" ? selection.apply(this, arguments) : selection, state.extent),
                    i = interpolate$1(selection0, selection1);

                function tween(t) {
                  state.selection = t === 1 && selection1 === null ? null : i(t);
                  redraw.call(that);
                  emit.brush();
                }

                return selection0 !== null && selection1 !== null ? tween : tween(1);
              });
        } else {
          group
              .each(function() {
                var that = this,
                    args = arguments,
                    state = that.__brush,
                    selection1 = dim.input(typeof selection === "function" ? selection.apply(that, args) : selection, state.extent),
                    emit = emitter(that, args).beforestart();

                interrupt(that);
                state.selection = selection1 === null ? null : selection1;
                redraw.call(that);
                emit.start(event).brush(event).end(event);
              });
        }
      };

      brush.clear = function(group, event) {
        brush.move(group, null, event);
      };

      function redraw() {
        var group = select(this),
            selection = local(this).selection;

        if (selection) {
          group.selectAll(".selection")
              .style("display", null)
              .attr("x", selection[0][0])
              .attr("y", selection[0][1])
              .attr("width", selection[1][0] - selection[0][0])
              .attr("height", selection[1][1] - selection[0][1]);

          group.selectAll(".handle")
              .style("display", null)
              .attr("x", function(d) { return d.type[d.type.length - 1] === "e" ? selection[1][0] - handleSize / 2 : selection[0][0] - handleSize / 2; })
              .attr("y", function(d) { return d.type[0] === "s" ? selection[1][1] - handleSize / 2 : selection[0][1] - handleSize / 2; })
              .attr("width", function(d) { return d.type === "n" || d.type === "s" ? selection[1][0] - selection[0][0] + handleSize : handleSize; })
              .attr("height", function(d) { return d.type === "e" || d.type === "w" ? selection[1][1] - selection[0][1] + handleSize : handleSize; });
        }

        else {
          group.selectAll(".selection,.handle")
              .style("display", "none")
              .attr("x", null)
              .attr("y", null)
              .attr("width", null)
              .attr("height", null);
        }
      }

      function emitter(that, args, clean) {
        var emit = that.__brush.emitter;
        return emit && (!clean || !emit.clean) ? emit : new Emitter(that, args, clean);
      }

      function Emitter(that, args, clean) {
        this.that = that;
        this.args = args;
        this.state = that.__brush;
        this.active = 0;
        this.clean = clean;
      }

      Emitter.prototype = {
        beforestart: function() {
          if (++this.active === 1) this.state.emitter = this, this.starting = true;
          return this;
        },
        start: function(event, mode) {
          if (this.starting) this.starting = false, this.emit("start", event, mode);
          else this.emit("brush", event);
          return this;
        },
        brush: function(event, mode) {
          this.emit("brush", event, mode);
          return this;
        },
        end: function(event, mode) {
          if (--this.active === 0) delete this.state.emitter, this.emit("end", event, mode);
          return this;
        },
        emit: function(type, event, mode) {
          var d = select(this.that).datum();
          listeners.call(
            type,
            this.that,
            new BrushEvent(type, {
              sourceEvent: event,
              target: brush,
              selection: dim.output(this.state.selection),
              mode,
              dispatch: listeners
            }),
            d
          );
        }
      };

      function started(event) {
        if (touchending && !event.touches) return;
        if (!filter.apply(this, arguments)) return;

        var that = this,
            type = event.target.__data__.type,
            mode = (keys && event.metaKey ? type = "overlay" : type) === "selection" ? MODE_DRAG : (keys && event.altKey ? MODE_CENTER : MODE_HANDLE),
            signX = dim === Y ? null : signsX[type],
            signY = dim === X ? null : signsY[type],
            state = local(that),
            extent = state.extent,
            selection = state.selection,
            W = extent[0][0], w0, w1,
            N = extent[0][1], n0, n1,
            E = extent[1][0], e0, e1,
            S = extent[1][1], s0, s1,
            dx = 0,
            dy = 0,
            moving,
            shifting = signX && signY && keys && event.shiftKey,
            lockX,
            lockY,
            points = Array.from(event.touches || [event], t => {
              const i = t.identifier;
              t = pointer(t, that);
              t.point0 = t.slice();
              t.identifier = i;
              return t;
            });

        interrupt(that);
        var emit = emitter(that, arguments, true).beforestart();

        if (type === "overlay") {
          if (selection) moving = true;
          const pts = [points[0], points[1] || points[0]];
          state.selection = selection = [[
              w0 = dim === Y ? W : min$2(pts[0][0], pts[1][0]),
              n0 = dim === X ? N : min$2(pts[0][1], pts[1][1])
            ], [
              e0 = dim === Y ? E : max$2(pts[0][0], pts[1][0]),
              s0 = dim === X ? S : max$2(pts[0][1], pts[1][1])
            ]];
          if (points.length > 1) move(event);
        } else {
          w0 = selection[0][0];
          n0 = selection[0][1];
          e0 = selection[1][0];
          s0 = selection[1][1];
        }

        w1 = w0;
        n1 = n0;
        e1 = e0;
        s1 = s0;

        var group = select(that)
            .attr("pointer-events", "none");

        var overlay = group.selectAll(".overlay")
            .attr("cursor", cursors[type]);

        if (event.touches) {
          emit.moved = moved;
          emit.ended = ended;
        } else {
          var view = select(event.view)
              .on("mousemove.brush", moved, true)
              .on("mouseup.brush", ended, true);
          if (keys) view
              .on("keydown.brush", keydowned, true)
              .on("keyup.brush", keyupped, true);

          dragDisable(event.view);
        }

        redraw.call(that);
        emit.start(event, mode.name);

        function moved(event) {
          for (const p of event.changedTouches || [event]) {
            for (const d of points)
              if (d.identifier === p.identifier) d.cur = pointer(p, that);
          }
          if (shifting && !lockX && !lockY && points.length === 1) {
            const point = points[0];
            if (abs(point.cur[0] - point[0]) > abs(point.cur[1] - point[1]))
              lockY = true;
            else
              lockX = true;
          }
          for (const point of points)
            if (point.cur) point[0] = point.cur[0], point[1] = point.cur[1];
          moving = true;
          noevent(event);
          move(event);
        }

        function move(event) {
          const point = points[0], point0 = point.point0;
          var t;

          dx = point[0] - point0[0];
          dy = point[1] - point0[1];

          switch (mode) {
            case MODE_SPACE:
            case MODE_DRAG: {
              if (signX) dx = max$2(W - w0, min$2(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
              if (signY) dy = max$2(N - n0, min$2(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
              break;
            }
            case MODE_HANDLE: {
              if (points[1]) {
                if (signX) w1 = max$2(W, min$2(E, points[0][0])), e1 = max$2(W, min$2(E, points[1][0])), signX = 1;
                if (signY) n1 = max$2(N, min$2(S, points[0][1])), s1 = max$2(N, min$2(S, points[1][1])), signY = 1;
              } else {
                if (signX < 0) dx = max$2(W - w0, min$2(E - w0, dx)), w1 = w0 + dx, e1 = e0;
                else if (signX > 0) dx = max$2(W - e0, min$2(E - e0, dx)), w1 = w0, e1 = e0 + dx;
                if (signY < 0) dy = max$2(N - n0, min$2(S - n0, dy)), n1 = n0 + dy, s1 = s0;
                else if (signY > 0) dy = max$2(N - s0, min$2(S - s0, dy)), n1 = n0, s1 = s0 + dy;
              }
              break;
            }
            case MODE_CENTER: {
              if (signX) w1 = max$2(W, min$2(E, w0 - dx * signX)), e1 = max$2(W, min$2(E, e0 + dx * signX));
              if (signY) n1 = max$2(N, min$2(S, n0 - dy * signY)), s1 = max$2(N, min$2(S, s0 + dy * signY));
              break;
            }
          }

          if (e1 < w1) {
            signX *= -1;
            t = w0, w0 = e0, e0 = t;
            t = w1, w1 = e1, e1 = t;
            if (type in flipX) overlay.attr("cursor", cursors[type = flipX[type]]);
          }

          if (s1 < n1) {
            signY *= -1;
            t = n0, n0 = s0, s0 = t;
            t = n1, n1 = s1, s1 = t;
            if (type in flipY) overlay.attr("cursor", cursors[type = flipY[type]]);
          }

          if (state.selection) selection = state.selection; // May be set by brush.move!
          if (lockX) w1 = selection[0][0], e1 = selection[1][0];
          if (lockY) n1 = selection[0][1], s1 = selection[1][1];

          if (selection[0][0] !== w1
              || selection[0][1] !== n1
              || selection[1][0] !== e1
              || selection[1][1] !== s1) {
            state.selection = [[w1, n1], [e1, s1]];
            redraw.call(that);
            emit.brush(event, mode.name);
          }
        }

        function ended(event) {
          nopropagation(event);
          if (event.touches) {
            if (event.touches.length) return;
            if (touchending) clearTimeout(touchending);
            touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
          } else {
            yesdrag(event.view, moving);
            view.on("keydown.brush keyup.brush mousemove.brush mouseup.brush", null);
          }
          group.attr("pointer-events", "all");
          overlay.attr("cursor", cursors.overlay);
          if (state.selection) selection = state.selection; // May be set by brush.move (on start)!
          if (empty(selection)) state.selection = null, redraw.call(that);
          emit.end(event, mode.name);
        }

        function keydowned(event) {
          switch (event.keyCode) {
            case 16: { // SHIFT
              shifting = signX && signY;
              break;
            }
            case 18: { // ALT
              if (mode === MODE_HANDLE) {
                if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                mode = MODE_CENTER;
                move(event);
              }
              break;
            }
            case 32: { // SPACE; takes priority over ALT
              if (mode === MODE_HANDLE || mode === MODE_CENTER) {
                if (signX < 0) e0 = e1 - dx; else if (signX > 0) w0 = w1 - dx;
                if (signY < 0) s0 = s1 - dy; else if (signY > 0) n0 = n1 - dy;
                mode = MODE_SPACE;
                overlay.attr("cursor", cursors.selection);
                move(event);
              }
              break;
            }
            default: return;
          }
          noevent(event);
        }

        function keyupped(event) {
          switch (event.keyCode) {
            case 16: { // SHIFT
              if (shifting) {
                lockX = lockY = shifting = false;
                move(event);
              }
              break;
            }
            case 18: { // ALT
              if (mode === MODE_CENTER) {
                if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
                if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
                mode = MODE_HANDLE;
                move(event);
              }
              break;
            }
            case 32: { // SPACE
              if (mode === MODE_SPACE) {
                if (event.altKey) {
                  if (signX) e0 = e1 - dx * signX, w0 = w1 + dx * signX;
                  if (signY) s0 = s1 - dy * signY, n0 = n1 + dy * signY;
                  mode = MODE_CENTER;
                } else {
                  if (signX < 0) e0 = e1; else if (signX > 0) w0 = w1;
                  if (signY < 0) s0 = s1; else if (signY > 0) n0 = n1;
                  mode = MODE_HANDLE;
                }
                overlay.attr("cursor", cursors[type]);
                move(event);
              }
              break;
            }
            default: return;
          }
          noevent(event);
        }
      }

      function touchmoved(event) {
        emitter(this, arguments).moved(event);
      }

      function touchended(event) {
        emitter(this, arguments).ended(event);
      }

      function initialize() {
        var state = this.__brush || {selection: null};
        state.extent = number2(extent.apply(this, arguments));
        state.dim = dim;
        return state;
      }

      brush.extent = function(_) {
        return arguments.length ? (extent = typeof _ === "function" ? _ : constant$1(number2(_)), brush) : extent;
      };

      brush.filter = function(_) {
        return arguments.length ? (filter = typeof _ === "function" ? _ : constant$1(!!_), brush) : filter;
      };

      brush.touchable = function(_) {
        return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$1(!!_), brush) : touchable;
      };

      brush.handleSize = function(_) {
        return arguments.length ? (handleSize = +_, brush) : handleSize;
      };

      brush.keyModifiers = function(_) {
        return arguments.length ? (keys = !!_, brush) : keys;
      };

      brush.on = function() {
        var value = listeners.on.apply(listeners, arguments);
        return value === listeners ? brush : value;
      };

      return brush;
    }

    function ascending(a, b) {
      return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(f) {
      let delta = f;
      let compare1 = f;
      let compare2 = f;

      if (f.length !== 2) {
        delta = (d, x) => f(d) - x;
        compare1 = ascending;
        compare2 = (d, x) => ascending(f(d), x);
      }

      function left(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function right(a, x, lo = 0, hi = a.length) {
        if (lo < hi) {
          if (compare1(x, x) !== 0) return hi;
          do {
            const mid = (lo + hi) >>> 1;
            if (compare2(a[mid], x) <= 0) lo = mid + 1;
            else hi = mid;
          } while (lo < hi);
        }
        return lo;
      }

      function center(a, x, lo = 0, hi = a.length) {
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }

      return {left, center, right};
    }

    function number$1(x) {
      return x === null ? NaN : +x;
    }

    const ascendingBisect = bisector(ascending);
    const bisectRight = ascendingBisect.right;
    bisector(number$1).center;
    var bisect = bisectRight;

    function extent(values, valueof) {
      let min;
      let max;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null) {
            if (min === undefined) {
              if (value >= value) min = max = value;
            } else {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null) {
            if (min === undefined) {
              if (value >= value) min = max = value;
            } else {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      }
      return [min, max];
    }

    class InternMap extends Map {
      constructor(entries, key = keyof) {
        super();
        Object.defineProperties(this, {_intern: {value: new Map()}, _key: {value: key}});
        if (entries != null) for (const [key, value] of entries) this.set(key, value);
      }
      get(key) {
        return super.get(intern_get(this, key));
      }
      has(key) {
        return super.has(intern_get(this, key));
      }
      set(key, value) {
        return super.set(intern_set(this, key), value);
      }
      delete(key) {
        return super.delete(intern_delete(this, key));
      }
    }

    function intern_get({_intern, _key}, value) {
      const key = _key(value);
      return _intern.has(key) ? _intern.get(key) : value;
    }

    function intern_set({_intern, _key}, value) {
      const key = _key(value);
      if (_intern.has(key)) return _intern.get(key);
      _intern.set(key, value);
      return value;
    }

    function intern_delete({_intern, _key}, value) {
      const key = _key(value);
      if (_intern.has(key)) {
        value = _intern.get(key);
        _intern.delete(key);
      }
      return value;
    }

    function keyof(value) {
      return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        let r0 = Math.round(start / step), r1 = Math.round(stop / step);
        if (r0 * step < start) ++r0;
        if (r1 * step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) * step;
      } else {
        step = -step;
        let r0 = Math.round(start * step), r1 = Math.round(stop * step);
        if (r0 / step < start) ++r0;
        if (r1 / step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    function max$1(values, valueof) {
      let max;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null
              && (max < value || (max === undefined && value >= value))) {
            max = value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null
              && (max < value || (max === undefined && value >= value))) {
            max = value;
          }
        }
      }
      return max;
    }

    function min$1(values, valueof) {
      let min;
      if (valueof === undefined) {
        for (const value of values) {
          if (value != null
              && (min > value || (min === undefined && value >= value))) {
            min = value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null
              && (min > value || (min === undefined && value >= value))) {
            min = value;
          }
        }
      }
      return min;
    }

    function mean(values, valueof) {
      let count = 0;
      let sum = 0;
      if (valueof === undefined) {
        for (let value of values) {
          if (value != null && (value = +value) >= value) {
            ++count, sum += value;
          }
        }
      } else {
        let index = -1;
        for (let value of values) {
          if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
            ++count, sum += value;
          }
        }
      }
      if (count) return sum / count;
    }

    function range(start, stop, step) {
      start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

      var i = -1,
          n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
          range = new Array(n);

      while (++i < n) {
        range[i] = start + i * step;
      }

      return range;
    }

    function link_filter(links) {
        let links_filtered;
        // Remove self links
        links_filtered = links.filter(k => k.source !== k.target);
        // Remove symmetric links
        links_filtered.forEach((el, i) => { el.referenceID = i; });
        links_filtered.forEach((el, i, arr) => {
            const symLink = arr.filter(k => k.source === el.target && k.target === el.source);
            if (symLink.length != 0) {
                el.symmetricLink = symLink[0].referenceID;
            }
        });
        let toKeep = links_filtered.map(d => d.referenceID);
        links_filtered.forEach((el, i, nodes) => {
            if (toKeep.includes(el.referenceID)) {
                toKeep = toKeep.filter(k => k !== el.symmetricLink);
            }
        });
        links_filtered = links_filtered.filter(k => toKeep.includes(k.referenceID));
        
        return links_filtered;
    }

    function zoomFunction(w, h, filter_function, storeParameters) {
        function zoomed({transform}) {
            select(this).select('g').attr("transform", transform);
            if (storeParameters) {
                transformX.set(transform.x);
                transformY.set(transform.y);
                transformK.set(transform.k);
                select(this).select('.selection')._groups[0][0].attributes.style.value = "display: none";
            }
        }
        return zoom()
            .filter(filter_function)
            .extent([[0, 0], [w, h]])
            .on("zoom", zoomed);
    }

    function dragFunction (node, simulation) {
        simulationPause.set(false);
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            node.fx = event.subject.x;
            node.fy = event.subject.y;
        }
        function dragged(event) {
            node.fx = event.x;
            node.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
        }
        return drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    function highlight(data, self) {
        const current = self.label;
        toHighlight.set([...new Set(data.filter(k => k.source.label === current || k.target.label === current).map(d => [d.source.label,d.target.label]).flat())]); 
    }
    function fade() {
        toHighlight.set([]);
    }

    function brushFunction(element, filter_function_brush) {
        const cells = select(element).selectAll('rect');
        function brushed({selection}) {
            if (selection) {
                let [[x0,y0],[x1,y1]] = selection;
                const filter_function = (d, i, nodes) => (x0 <= get_store_value(transformX) + (get_store_value(transformK)*Number(nodes[i].attributes.x.value)) && get_store_value(transformX) + (get_store_value(transformK)*(Number(nodes[i].attributes.x.value))) < x1 && y0 <= get_store_value(transformY) + (get_store_value(transformK)*(Number(nodes[i].attributes.y.value))) && get_store_value(transformY) + (get_store_value(transformK)*(Number(nodes[i].attributes.y.value))) < y1 || x0 <= get_store_value(transformX) + (get_store_value(transformK)*(Number(nodes[i].attributes.x.value) + Number(nodes[i].attributes.width.value))) && get_store_value(transformX) + (get_store_value(transformK)*(Number(nodes[i].attributes.x.value))) < x1 && y0 <= get_store_value(transformY) + (get_store_value(transformK)*(Number(nodes[i].attributes.y.value) + Number(nodes[i].attributes.height.value))) && get_store_value(transformY) + (get_store_value(transformK)*(Number(nodes[i].attributes.y.value))) < y1);
                cells.filter((d, i, nodes) => !filter_function(d, i, nodes)).attr('opacity', .3);
                cells.filter((d, i, nodes) => filter_function(d, i, nodes)).attr('opacity', 1);    
                nodeFilter.set([...new Set(Array.from(cells.filter((d, i, nodes) => filter_function(d, i, nodes))).map(d => [d.attributes.source.value, d.attributes.target.value]).flat())]);
            } else {
                cells.attr('opacity', 1);
                nodeFilter.set([]);
            }
        }
        return brush()
            .filter(filter_function_brush)
            .on("brush end", brushed);
    }

    function links2Matrix(nodes, links) {
        const matrix = [];
        for (const source of nodes) {
            const row = [];
            for (const target of nodes) {
                const cell = links.filter(k => k.source === source.label && k.target === target.label);
                cell.length !== 0 ? row.push(cell[0].value) : row.push(0);
            }
            matrix.push(row);
        }
        return matrix;
    }

    //The other input data == the original data matrix, not the relation data. But check other data input
    function csvToArray(str, delimiter = ";") {

        // slice from \n index + 1 to the end of the text but not rading the end line (= blank values) in anymore, hence the -1
        //-1 very crucial for this!! 
        // use split to create an array of each csv value row
        // 
        const rows = str.slice(str.indexOf("\n") + 1, -1).split("\n");
      
        // Map the rows
        // split values from each row into an array
        // use headers.reduce to create an object
        // object properties derived from headers:values
        // the object passed as an element of the array
        const arr = rows.map(function (row) {
          const values = row.split(delimiter);
          return values;
        });

        // return the array
        return arr;
      }

    // Replacing cosine with "precomputed" works but then you need a square matrix 
    function hclust(adjMatrix, linkage) {
        let matrix = druid.Matrix.from(adjMatrix);
        let H = new druid.Hierarchical_Clustering(matrix, linkage, "precomputed");
        maxDepth.set(H.root["depth"]);
        return H;
    }

    function dendogram(nodes) {
        const leaves = nodes.filter(n => n.isLeaf);
        const links = [];
        leaves.forEach((node, i) => node.x = i);
        nodes.forEach((node, i) => {
            node.x = node.x ?? mean(node.leaves(), d => d.x);
            [node.left, node.right].forEach(child => {
            if (child) {
                links.push({
                "source": node,
                "target": child
                });
            }
            });
        });
        return {
            "nodes": nodes,
            "links":links,
        }
    }

    function clusters(H, t, n) {
        const H_clusters = H.get_clusters(t, "depth");
        let I = Array.from({length: n});
        
        for (let cluster_index = 0; cluster_index < H_clusters.length; ++cluster_index) {
            H_clusters[cluster_index].forEach(({index}) => I[index] = cluster_index);
        }
        
        return I
    }

    function pathGenerator(link, x, y, tf_x, tf_k) {
        const x1 = x(link.source.x * tf_k) + tf_x;
        const y1 = y(link.source["depth"]);
        const x2 = x(link.target.x * tf_k) +tf_x;
        const y2 = y(link.target["depth"]);
        const max_radius = 20;
        const x_dist = Math.abs(x1 - x2);
        const y_dist = Math.abs(y1 - y2);
        const radius = Math.min(x_dist, y_dist, max_radius);
        const cx = x1 < x2 ? radius : -radius;
        const counter_clockwise = cx < 0 ? 0 : 1;
        const xa = x2 - cx;
        return `M ${x1} ${y1} H ${xa} a ${radius} ${radius} 0 0 ${counter_clockwise} ${cx} ${radius} V ${y2}`;
    }

    function toolTip (obj) {
        let tooltip = '';
        for (const [key, value] of Object.entries(obj)) {
            if (!(key === 'index' || key === 'x' || key === 'y' || key === 'vx' || key === 'vy' || key === 'fx' || key === 'fy')) {
               tooltip = tooltip + '\n' + `${key}: ${value}`;
            }
        }
        return tooltip
    }

    // Navigation
    const threshold_edges = writable(0);
    const threshold_clust = writable(10);
    const maxDepth = writable(10);
    const radius = writable(4);
    const linkage = writable("none");
    const renderVisuals = writable(false);
    const simulationPause = writable(false);
    const toHighlight = writable([]);
    const nodeFilter = writable([]);
    const color_method_nodes = writable();
    const color_method_edges = writable();
    const edge_width = writable(1);
    const domain_min = writable(-1);
    const domain_center = writable(0);
    const domain_max = writable(1);
    const transformX = writable(0);
    const transformY = writable(0);
    const transformK = writable(1);

    // Data
    const toggle_sidebar = writable(false);
    // For the dendorgram data
    const _data_2 = writable([]);
    const myArray = _data_2;


    //The _data writable beneeth gets loaded in the sidebar component.
    const _data = writable([]);

    derived(_data, ($_data) => {
        if (!$_data.nodes) {
            return [];
        }
        if (!$_data.nodes[0].id) {
            $_data.nodes.forEach((element, index) => element.id = index);
        }
        return $_data.nodes.map(d => d);
    });




    const nodes = derived(_data, ($_data) => {
        if (!$_data.nodes) {
            return [];
        }
        if (!$_data.nodes[0].id) {
            $_data.nodes.forEach((element, index) => element.id = index);
        }
        return $_data.nodes.map(d => d);
    });
    const node_variables = derived(_data, ($_data) => {
        if (!$_data.nodes) {
            return [];
        }
        return Object.keys($_data.nodes[0]).filter(k => !(k === "label" || k === "id"))
    });
    const links_network = derived(_data, ($_data) => {
        if (!$_data.links) {
            return [];
        }

        // important to see that here to links are defined!! 
     const links = $_data.links.map(d => { return {source: d.source, target: d.target, value: d.value} });
        return link_filter(links);
    });
    const links_heatmap = derived(_data, ($_data) => {
        if (!$_data.links) {
            return [];
        }
        return $_data.links.map(d => { return {source: d.source, target: d.target, value: d.value} });
    });
    const link_variables = derived(_data, ($_data) => {
        if (!$_data.links) {
            return [];
        }
        return Object.keys($_data.links[0]).filter(k => !(k === "source" || k === "target" || k === "referenceID" || k === "symmetricLink"))
    });

    // not needed here, should be put were variable is actually called
    // $:console.log(node_variables)

    function colors(specifier) {
      var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
      while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
      return colors;
    }

    var schemeTableau10 = colors("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");

    var ramp = scheme => rgbBasis(scheme[scheme.length - 1]);

    var scheme$2 = new Array(3).concat(
      "d8b365f5f5f55ab4ac",
      "a6611adfc27d80cdc1018571",
      "a6611adfc27df5f5f580cdc1018571",
      "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
      "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
      "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
      "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
      "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
      "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
    ).map(colors);

    var interpolateBrBG = ramp(scheme$2);

    var scheme$1 = new Array(3).concat(
      "ef8a62f7f7f767a9cf",
      "ca0020f4a58292c5de0571b0",
      "ca0020f4a582f7f7f792c5de0571b0",
      "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
      "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
      "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
      "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
      "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
      "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
    ).map(colors);

    var interpolateRdBu = ramp(scheme$1);

    var scheme = new Array(3).concat(
      "deebf79ecae13182bd",
      "eff3ffbdd7e76baed62171b5",
      "eff3ffbdd7e76baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
    ).map(colors);

    var interpolateBlues = ramp(scheme);

    /* src\_components\Sidebar.svelte generated by Svelte v3.49.0 */

    const { console: console_1$3 } = globals;
    const file_1 = "src\\_components\\Sidebar.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[53] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[53] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[58] = list[i];
    	return child_ctx;
    }

    // (156:28) {#each cluster_methods as method}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*method*/ ctx[58] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*method*/ ctx[58];
    			option.value = option.__value;
    			add_location(option, file_1, 156, 32, 5827);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop$2,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(156:28) {#each cluster_methods as method}",
    		ctx
    	});

    	return block;
    }

    // (227:28) {#each color_options_nodes as option}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[53] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[53];
    			option.value = option.__value;
    			add_location(option, file_1, 227, 32, 10786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*color_options_nodes*/ 8 && t_value !== (t_value = /*option*/ ctx[53] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*color_options_nodes*/ 8 && option_value_value !== (option_value_value = /*option*/ ctx[53])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(227:28) {#each color_options_nodes as option}",
    		ctx
    	});

    	return block;
    }

    // (240:28) {#each color_options_edges as option}
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[53] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[53];
    			option.value = option.__value;
    			add_location(option, file_1, 240, 32, 11644);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*color_options_edges*/ 16 && t_value !== (t_value = /*option*/ ctx[53] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*color_options_edges*/ 16 && option_value_value !== (option_value_value = /*option*/ ctx[53])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(240:28) {#each color_options_edges as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div22;
    	let div0;
    	let t1;
    	let div21;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div3;
    	let label2;
    	let t8;
    	let t9;
    	let t10;
    	let input2;
    	let t11;
    	let ul;
    	let li0;
    	let button0;
    	let t13;
    	let div6;
    	let div4;
    	let label3;
    	let t15;
    	let select0;
    	let t16;
    	let div5;
    	let label4;
    	let t17;
    	let t18;
    	let t19;
    	let input3;
    	let t20;
    	let li1;
    	let button1;
    	let t22;
    	let div12;
    	let div7;
    	let t24;
    	let div8;
    	let label5;
    	let t26;
    	let input4;
    	let t27;
    	let div9;
    	let label6;
    	let t29;
    	let input5;
    	let t30;
    	let div10;
    	let label7;
    	let t32;
    	let input6;
    	let t33;
    	let div11;
    	let svg;
    	let defs;
    	let linearGradient;
    	let stop0;
    	let stop1;
    	let stop2;
    	let rect;
    	let g3;
    	let line0;
    	let g0;
    	let line1;
    	let text0;
    	let t34;
    	let g1;
    	let line2;
    	let text1;
    	let t35;
    	let g2;
    	let line3;
    	let text2;
    	let t36;
    	let t37;
    	let li2;
    	let button2;
    	let t39;
    	let div19;
    	let div13;
    	let t41;
    	let div14;
    	let label8;
    	let t42;
    	let t43;
    	let t44;
    	let input7;
    	let t45;
    	let div15;
    	let label9;
    	let t47;
    	let select1;
    	let t48;
    	let div16;
    	let t50;
    	let div17;
    	let label10;
    	let t51;
    	let t52;
    	let t53;
    	let input8;
    	let t54;
    	let div18;
    	let label11;
    	let t56;
    	let select2;
    	let t57;
    	let div20;
    	let button3;
    	let t59;
    	let button4;
    	let t61;
    	let button5;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*cluster_methods*/ ctx[19];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*color_options_nodes*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*color_options_edges*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div22 = element("div");
    			div0 = element("div");
    			div0.textContent = "Multi-Omics Brush";
    			t1 = space();
    			div21 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Input File";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Input File for clustering";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			label2 = element("label");
    			t8 = text("Threshold edges: ");
    			t9 = text(/*$threshold_edges*/ ctx[8]);
    			t10 = space();
    			input2 = element("input");
    			t11 = space();
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "Clustering";
    			t13 = space();
    			div6 = element("div");
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Select clustering";
    			t15 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t16 = space();
    			div5 = element("div");
    			label4 = element("label");
    			t17 = text("Threshold clustering: ");
    			t18 = text(/*$threshold_clust*/ ctx[10]);
    			t19 = space();
    			input3 = element("input");
    			t20 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Matrix Styling";
    			t22 = space();
    			div12 = element("div");
    			div7 = element("div");
    			div7.textContent = "Domain colorscale";
    			t24 = space();
    			div8 = element("div");
    			label5 = element("label");
    			label5.textContent = "min value";
    			t26 = space();
    			input4 = element("input");
    			t27 = space();
    			div9 = element("div");
    			label6 = element("label");
    			label6.textContent = "center value";
    			t29 = space();
    			input5 = element("input");
    			t30 = space();
    			div10 = element("div");
    			label7 = element("label");
    			label7.textContent = "max value";
    			t32 = space();
    			input6 = element("input");
    			t33 = space();
    			div11 = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			linearGradient = svg_element("linearGradient");
    			stop0 = svg_element("stop");
    			stop1 = svg_element("stop");
    			stop2 = svg_element("stop");
    			rect = svg_element("rect");
    			g3 = svg_element("g");
    			line0 = svg_element("line");
    			g0 = svg_element("g");
    			line1 = svg_element("line");
    			text0 = svg_element("text");
    			t34 = text(/*$domain_min*/ ctx[12]);
    			g1 = svg_element("g");
    			line2 = svg_element("line");
    			text1 = svg_element("text");
    			t35 = text(/*$domain_center*/ ctx[14]);
    			g2 = svg_element("g");
    			line3 = svg_element("line");
    			text2 = svg_element("text");
    			t36 = text(/*$domain_max*/ ctx[13]);
    			t37 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "Graph Styling";
    			t39 = space();
    			div19 = element("div");
    			div13 = element("div");
    			div13.textContent = "Nodes";
    			t41 = space();
    			div14 = element("div");
    			label8 = element("label");
    			t42 = text("Radius: ");
    			t43 = text(/*$radius*/ ctx[15]);
    			t44 = space();
    			input7 = element("input");
    			t45 = space();
    			div15 = element("div");
    			label9 = element("label");
    			label9.textContent = "Color variable";
    			t47 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t48 = space();
    			div16 = element("div");
    			div16.textContent = "Edges";
    			t50 = space();
    			div17 = element("div");
    			label10 = element("label");
    			t51 = text("Width: ");
    			t52 = text(/*$edge_width*/ ctx[17]);
    			t53 = space();
    			input8 = element("input");
    			t54 = space();
    			div18 = element("div");
    			label11 = element("label");
    			label11.textContent = "Color variable";
    			t56 = space();
    			select2 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t57 = space();
    			div20 = element("div");
    			button3 = element("button");
    			button3.textContent = "Run";
    			t59 = space();
    			button4 = element("button");
    			button4.textContent = "Pause";
    			t61 = space();
    			button5 = element("button");
    			button5.textContent = "Reset";
    			attr_dev(div0, "class", "sidebar-heading text-center py-4 fs-4 fw-bold border-bottom svelte-g8fv8k");
    			add_location(div0, file_1, 129, 4, 4022);
    			attr_dev(label0, "for", "formFile");
    			attr_dev(label0, "class", "form-label");
    			add_location(label0, file_1, 132, 12, 4195);
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "formFile");
    			attr_dev(input0, "accept", ".json");
    			add_location(input0, file_1, 133, 12, 4267);
    			attr_dev(div1, "class", "mt-4 mb-2 mx-3");
    			add_location(div1, file_1, 131, 8, 4154);
    			attr_dev(label1, "for", "formFile");
    			attr_dev(label1, "class", "form-label");
    			add_location(label1, file_1, 138, 12, 4543);
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "id", "formFile");
    			attr_dev(input1, "accept", ".csv");
    			add_location(input1, file_1, 139, 12, 4631);
    			attr_dev(div2, "class", "mt-4 mb-2 mx-3");
    			add_location(div2, file_1, 137, 8, 4502);
    			attr_dev(label2, "for", "threshold_edges");
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file_1, 143, 12, 4794);
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "class", "form-range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "1");
    			attr_dev(input2, "step", "0.01");
    			attr_dev(input2, "id", "threshold_edges");
    			add_location(input2, file_1, 144, 12, 4898);
    			attr_dev(div3, "class", "mt-4 mb-2 mx-3");
    			add_location(div3, file_1, 142, 8, 4753);
    			attr_dev(button0, "class", "btn btn-toggle align-items-center rounded collapsed mb-2 svelte-g8fv8k");
    			attr_dev(button0, "data-bs-toggle", "collapse");
    			attr_dev(button0, "data-bs-target", "#collapse-clustering");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-controls", "collapse-clustering");
    			add_location(button0, file_1, 148, 16, 5150);
    			attr_dev(label3, "for", "clustering-method");
    			attr_dev(label3, "class", "form-label");
    			add_location(label3, file_1, 153, 24, 5559);
    			attr_dev(select0, "class", "form-select");
    			attr_dev(select0, "id", "clustering-method");
    			if (/*$linkage*/ ctx[9] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[35].call(select0));
    			add_location(select0, file_1, 154, 24, 5659);
    			attr_dev(div4, "class", "mb-2 mx-3");
    			add_location(div4, file_1, 152, 20, 5511);
    			attr_dev(label4, "for", "threshold_clust");
    			attr_dev(label4, "class", "form-label");
    			add_location(label4, file_1, 161, 24, 6033);
    			attr_dev(input3, "type", "range");
    			attr_dev(input3, "class", "form-range");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", /*$maxDepth*/ ctx[11]);
    			attr_dev(input3, "step", "1");
    			attr_dev(input3, "id", "threshold_clust");
    			add_location(input3, file_1, 162, 24, 6154);
    			attr_dev(div5, "class", "mb-2 mx-3");
    			add_location(div5, file_1, 160, 20, 5985);
    			attr_dev(div6, "class", "collapse");
    			attr_dev(div6, "id", "collapse-clustering");
    			add_location(div6, file_1, 151, 16, 5443);
    			attr_dev(li0, "class", "ps-2 mb-1 item-1 clustering-controls svelte-g8fv8k");
    			add_location(li0, file_1, 147, 12, 5084);
    			attr_dev(button1, "class", "btn btn-toggle align-items-center rounded collapsed mb-2 svelte-g8fv8k");
    			attr_dev(button1, "data-bs-toggle", "collapse");
    			attr_dev(button1, "data-bs-target", "#collapse-styling-matrix");
    			attr_dev(button1, "aria-expanded", "false");
    			attr_dev(button1, "aria-controls", "collapse-styling-matrix");
    			add_location(button1, file_1, 167, 16, 6423);
    			attr_dev(div7, "class", "mb-2 mx-3 fw-bold");
    			add_location(div7, file_1, 171, 20, 6809);
    			attr_dev(label5, "for", "c-domain-min");
    			attr_dev(label5, "class", "form-label");
    			add_location(label5, file_1, 173, 24, 6952);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "min", "-1");
    			attr_dev(input4, "max", "0");
    			attr_dev(input4, "step", "0.01");
    			attr_dev(input4, "id", "c-domain-min");
    			add_location(input4, file_1, 174, 24, 7039);
    			attr_dev(div8, "class", "mb-2 mx-3 domain-values-input");
    			add_location(div8, file_1, 172, 20, 6884);
    			attr_dev(label6, "for", "c-domain-center");
    			attr_dev(label6, "class", "form-label");
    			add_location(label6, file_1, 177, 24, 7273);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "min", /*$domain_min*/ ctx[12]);
    			attr_dev(input5, "max", /*$domain_max*/ ctx[13]);
    			attr_dev(input5, "step", "0.01");
    			attr_dev(input5, "id", "c-domain-center");
    			add_location(input5, file_1, 178, 24, 7366);
    			attr_dev(div9, "class", "mb-2 mx-3 domain-values-input");
    			add_location(div9, file_1, 176, 20, 7205);
    			attr_dev(label7, "for", "c-domain-max");
    			attr_dev(label7, "class", "form-label");
    			add_location(label7, file_1, 181, 24, 7625);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "min", "0");
    			attr_dev(input6, "max", "1");
    			attr_dev(input6, "step", "0.01");
    			attr_dev(input6, "id", "c-domain-max");
    			add_location(input6, file_1, 182, 24, 7712);
    			attr_dev(div10, "class", "mb-2 mx-3 domain-values-input");
    			add_location(div10, file_1, 180, 20, 7557);
    			attr_dev(stop0, "offset", "0%");
    			attr_dev(stop0, "stop-color", interpolateRdBu(0));
    			add_location(stop0, file_1, 188, 36, 8144);
    			attr_dev(stop1, "offset", "50%");
    			attr_dev(stop1, "stop-color", interpolateRdBu(0.5));
    			add_location(stop1, file_1, 189, 36, 8238);
    			attr_dev(stop2, "offset", "100%");
    			attr_dev(stop2, "stop-color", interpolateRdBu(1));
    			add_location(stop2, file_1, 190, 36, 8335);
    			attr_dev(linearGradient, "id", "linear-gradient");
    			attr_dev(linearGradient, "x1", "0%");
    			attr_dev(linearGradient, "y1", "0%");
    			attr_dev(linearGradient, "x2", "100%");
    			attr_dev(linearGradient, "y2", "0%");
    			add_location(linearGradient, file_1, 187, 32, 8036);
    			add_location(defs, file_1, 186, 28, 7997);
    			attr_dev(rect, "width", "100%");
    			attr_dev(rect, "height", "30%");
    			attr_dev(rect, "fill", "url(#linear-gradient)");
    			add_location(rect, file_1, 193, 28, 8509);
    			attr_dev(line0, "class", "domain svelte-g8fv8k");
    			attr_dev(line0, "x1", "0%");
    			attr_dev(line0, "x2", "100%");
    			add_location(line0, file_1, 195, 32, 8655);
    			attr_dev(line1, "x1", "0%");
    			attr_dev(line1, "x2", "0%");
    			attr_dev(line1, "y1", "0");
    			attr_dev(line1, "y2", "6");
    			attr_dev(line1, "class", "svelte-g8fv8k");
    			add_location(line1, file_1, 197, 36, 8799);
    			attr_dev(text0, "x", "0%");
    			attr_dev(text0, "y", "11");
    			attr_dev(text0, "dy", "0.71em");
    			attr_dev(text0, "class", "svelte-g8fv8k");
    			add_location(text0, file_1, 198, 36, 8879);
    			attr_dev(g0, "class", "tick tick-first svelte-g8fv8k");
    			add_location(g0, file_1, 196, 32, 8734);
    			attr_dev(line2, "x1", "50%");
    			attr_dev(line2, "x2", "50%");
    			attr_dev(line2, "y1", "0");
    			attr_dev(line2, "y2", "6");
    			attr_dev(line2, "class", "svelte-g8fv8k");
    			add_location(line2, file_1, 201, 36, 9067);
    			attr_dev(text1, "x", "50%");
    			attr_dev(text1, "y", "11");
    			attr_dev(text1, "dy", "0.71em");
    			attr_dev(text1, "class", "svelte-g8fv8k");
    			add_location(text1, file_1, 202, 36, 9149);
    			attr_dev(g1, "class", "tick tick-middle svelte-g8fv8k");
    			add_location(g1, file_1, 200, 32, 9001);
    			attr_dev(line3, "x1", "100%");
    			attr_dev(line3, "x2", "100%");
    			attr_dev(line3, "y1", "0");
    			attr_dev(line3, "y2", "6");
    			attr_dev(line3, "class", "svelte-g8fv8k");
    			add_location(line3, file_1, 205, 36, 9339);
    			attr_dev(text2, "x", "100%");
    			attr_dev(text2, "y", "11");
    			attr_dev(text2, "dy", "0.71em");
    			attr_dev(text2, "class", "svelte-g8fv8k");
    			add_location(text2, file_1, 206, 36, 9423);
    			attr_dev(g2, "class", "tick tick-last svelte-g8fv8k");
    			add_location(g2, file_1, 204, 32, 9275);
    			attr_dev(g3, "class", "axis svelte-g8fv8k");
    			add_location(g3, file_1, 194, 28, 8606);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", 50);
    			add_location(svg, file_1, 185, 24, 7938);
    			attr_dev(div11, "class", "mb-2 mx-3 color-legend");
    			add_location(div11, file_1, 184, 20, 7877);
    			attr_dev(div12, "class", "collapse");
    			attr_dev(div12, "id", "collapse-styling-matrix");
    			add_location(div12, file_1, 170, 16, 6737);
    			attr_dev(li1, "class", "ps-2 mb-1 item-2 matrix-styling svelte-g8fv8k");
    			add_location(li1, file_1, 166, 12, 6362);
    			attr_dev(button2, "class", "btn btn-toggle align-items-center rounded collapsed mb-2 svelte-g8fv8k");
    			attr_dev(button2, "data-bs-toggle", "collapse");
    			attr_dev(button2, "data-bs-target", "#collapse-styling-graph");
    			attr_dev(button2, "aria-expanded", "false");
    			attr_dev(button2, "aria-controls", "collapse-styling-graph");
    			add_location(button2, file_1, 214, 16, 9719);
    			attr_dev(div13, "class", "mb-2 mx-3 fw-bold");
    			add_location(div13, file_1, 218, 20, 10100);
    			attr_dev(label8, "for", "node-radius");
    			attr_dev(label8, "class", "form-label");
    			add_location(label8, file_1, 220, 24, 10211);
    			attr_dev(input7, "type", "range");
    			attr_dev(input7, "class", "form-range");
    			attr_dev(input7, "min", "1");
    			attr_dev(input7, "max", "20");
    			attr_dev(input7, "step", "1");
    			attr_dev(input7, "id", "node-radius");
    			add_location(input7, file_1, 221, 24, 10305);
    			attr_dev(div14, "class", "mb-2 mx-3");
    			add_location(div14, file_1, 219, 20, 10163);
    			attr_dev(label9, "for", "color-method-nodes");
    			attr_dev(label9, "class", "form-label");
    			add_location(label9, file_1, 224, 24, 10504);
    			attr_dev(select1, "class", "form-select");
    			attr_dev(select1, "id", "color-method-nodes");
    			if (/*$color_method_nodes*/ ctx[16] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[41].call(select1));
    			add_location(select1, file_1, 225, 24, 10602);
    			attr_dev(div15, "class", "mb-2 mx-3");
    			add_location(div15, file_1, 223, 20, 10456);
    			attr_dev(div16, "class", "mt-3 mb-2 mx-3 fw-bold");
    			add_location(div16, file_1, 231, 20, 10948);
    			attr_dev(label10, "for", "edge-width");
    			attr_dev(label10, "class", "form-label");
    			add_location(label10, file_1, 233, 24, 11064);
    			attr_dev(input8, "type", "range");
    			attr_dev(input8, "class", "form-range");
    			attr_dev(input8, "min", "1");
    			attr_dev(input8, "max", "10");
    			attr_dev(input8, "step", "1");
    			attr_dev(input8, "id", "edge-width");
    			add_location(input8, file_1, 234, 24, 11160);
    			attr_dev(div17, "class", "mb-2 mx-3");
    			add_location(div17, file_1, 232, 20, 11016);
    			attr_dev(label11, "for", "color-method-edges");
    			attr_dev(label11, "class", "form-label");
    			add_location(label11, file_1, 237, 24, 11362);
    			attr_dev(select2, "class", "form-select");
    			attr_dev(select2, "id", "color-method-edges");
    			if (/*$color_method_edges*/ ctx[18] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[43].call(select2));
    			add_location(select2, file_1, 238, 24, 11460);
    			attr_dev(div18, "class", "mb-2 mx-3");
    			add_location(div18, file_1, 236, 20, 11314);
    			attr_dev(div19, "class", "collapse");
    			attr_dev(div19, "id", "collapse-styling-graph");
    			add_location(div19, file_1, 217, 16, 10029);
    			attr_dev(li2, "class", "ps-2 mb-1 item-3 graph-styling svelte-g8fv8k");
    			add_location(li2, file_1, 213, 12, 9659);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "btn btn-primary");
    			button3.disabled = true;
    			add_location(button3, file_1, 247, 16, 11879);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary");
    			button4.disabled = true;
    			add_location(button4, file_1, 248, 16, 12014);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-primary");
    			button5.disabled = true;
    			add_location(button5, file_1, 249, 16, 12155);
    			attr_dev(div20, "class", "mt-3 mx-3");
    			add_location(div20, file_1, 246, 12, 11839);
    			attr_dev(ul, "class", "list-unstyled my-3");
    			add_location(ul, file_1, 146, 8, 5040);
    			attr_dev(div21, "class", "controls svelte-g8fv8k");
    			add_location(div21, file_1, 130, 4, 4123);
    			attr_dev(div22, "class", "bg-dark text-light svelte-g8fv8k");
    			attr_dev(div22, "id", "sidebar-wrapper");
    			toggle_class(div22, "toggled", /*$toggle_sidebar*/ ctx[7]);
    			add_location(div22, file_1, 128, 0, 3932);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div0);
    			append_dev(div22, t1);
    			append_dev(div22, div21);
    			append_dev(div21, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div21, t4);
    			append_dev(div21, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			append_dev(div21, t7);
    			append_dev(div21, div3);
    			append_dev(div3, label2);
    			append_dev(label2, t8);
    			append_dev(label2, t9);
    			append_dev(div3, t10);
    			append_dev(div3, input2);
    			set_input_value(input2, /*$threshold_edges*/ ctx[8]);
    			append_dev(div21, t11);
    			append_dev(div21, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(li0, t13);
    			append_dev(li0, div6);
    			append_dev(div6, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t15);
    			append_dev(div4, select0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select_option(select0, /*$linkage*/ ctx[9]);
    			append_dev(div6, t16);
    			append_dev(div6, div5);
    			append_dev(div5, label4);
    			append_dev(label4, t17);
    			append_dev(label4, t18);
    			append_dev(div5, t19);
    			append_dev(div5, input3);
    			set_input_value(input3, /*$threshold_clust*/ ctx[10]);
    			append_dev(ul, t20);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(li1, t22);
    			append_dev(li1, div12);
    			append_dev(div12, div7);
    			append_dev(div12, t24);
    			append_dev(div12, div8);
    			append_dev(div8, label5);
    			append_dev(div8, t26);
    			append_dev(div8, input4);
    			set_input_value(input4, /*$domain_min*/ ctx[12]);
    			append_dev(div12, t27);
    			append_dev(div12, div9);
    			append_dev(div9, label6);
    			append_dev(div9, t29);
    			append_dev(div9, input5);
    			set_input_value(input5, /*$domain_center*/ ctx[14]);
    			append_dev(div12, t30);
    			append_dev(div12, div10);
    			append_dev(div10, label7);
    			append_dev(div10, t32);
    			append_dev(div10, input6);
    			set_input_value(input6, /*$domain_max*/ ctx[13]);
    			append_dev(div12, t33);
    			append_dev(div12, div11);
    			append_dev(div11, svg);
    			append_dev(svg, defs);
    			append_dev(defs, linearGradient);
    			append_dev(linearGradient, stop0);
    			append_dev(linearGradient, stop1);
    			append_dev(linearGradient, stop2);
    			append_dev(svg, rect);
    			append_dev(svg, g3);
    			append_dev(g3, line0);
    			append_dev(g3, g0);
    			append_dev(g0, line1);
    			append_dev(g0, text0);
    			append_dev(text0, t34);
    			append_dev(g3, g1);
    			append_dev(g1, line2);
    			append_dev(g1, text1);
    			append_dev(text1, t35);
    			append_dev(g3, g2);
    			append_dev(g2, line3);
    			append_dev(g2, text2);
    			append_dev(text2, t36);
    			append_dev(ul, t37);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(li2, t39);
    			append_dev(li2, div19);
    			append_dev(div19, div13);
    			append_dev(div19, t41);
    			append_dev(div19, div14);
    			append_dev(div14, label8);
    			append_dev(label8, t42);
    			append_dev(label8, t43);
    			append_dev(div14, t44);
    			append_dev(div14, input7);
    			set_input_value(input7, /*$radius*/ ctx[15]);
    			append_dev(div19, t45);
    			append_dev(div19, div15);
    			append_dev(div15, label9);
    			append_dev(div15, t47);
    			append_dev(div15, select1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_option(select1, /*$color_method_nodes*/ ctx[16]);
    			append_dev(div19, t48);
    			append_dev(div19, div16);
    			append_dev(div19, t50);
    			append_dev(div19, div17);
    			append_dev(div17, label10);
    			append_dev(label10, t51);
    			append_dev(label10, t52);
    			append_dev(div17, t53);
    			append_dev(div17, input8);
    			set_input_value(input8, /*$edge_width*/ ctx[17]);
    			append_dev(div19, t54);
    			append_dev(div19, div18);
    			append_dev(div18, label11);
    			append_dev(div18, t56);
    			append_dev(div18, select2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			select_option(select2, /*$color_method_edges*/ ctx[18]);
    			append_dev(ul, t57);
    			append_dev(ul, div20);
    			append_dev(div20, button3);
    			/*button3_binding*/ ctx[44](button3);
    			append_dev(div20, t59);
    			append_dev(div20, button4);
    			/*button4_binding*/ ctx[45](button4);
    			append_dev(div20, t61);
    			append_dev(div20, button5);
    			/*button5_binding*/ ctx[46](button5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[32]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[33]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[34]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[34]),
    					listen_dev(button0, "click", /*toggle_clust*/ ctx[20], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[35]),
    					listen_dev(input3, "change", /*input3_change_input_handler*/ ctx[36]),
    					listen_dev(input3, "input", /*input3_change_input_handler*/ ctx[36]),
    					listen_dev(button1, "click", /*toggle_styling_matrix*/ ctx[21], false, false, false),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[37]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[38]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[39]),
    					listen_dev(button2, "click", /*toggle_styling_graph*/ ctx[22], false, false, false),
    					listen_dev(input7, "change", /*input7_change_input_handler*/ ctx[40]),
    					listen_dev(input7, "input", /*input7_change_input_handler*/ ctx[40]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[41]),
    					listen_dev(input8, "change", /*input8_change_input_handler*/ ctx[42]),
    					listen_dev(input8, "input", /*input8_change_input_handler*/ ctx[42]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[43]),
    					listen_dev(button3, "click", /*eventHandler_runBtn*/ ctx[23], false, false, false),
    					listen_dev(button4, "click", /*eventHandler_pauseBtn*/ ctx[24], false, false, false),
    					listen_dev(button5, "click", /*eventHandler_resetBtn*/ ctx[25], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$threshold_edges*/ 256) set_data_dev(t9, /*$threshold_edges*/ ctx[8]);

    			if (dirty[0] & /*$threshold_edges*/ 256) {
    				set_input_value(input2, /*$threshold_edges*/ ctx[8]);
    			}

    			if (dirty[0] & /*cluster_methods*/ 524288) {
    				each_value_2 = /*cluster_methods*/ ctx[19];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*$linkage, cluster_methods*/ 524800) {
    				select_option(select0, /*$linkage*/ ctx[9]);
    			}

    			if (dirty[0] & /*$threshold_clust*/ 1024) set_data_dev(t18, /*$threshold_clust*/ ctx[10]);

    			if (dirty[0] & /*$maxDepth*/ 2048) {
    				attr_dev(input3, "max", /*$maxDepth*/ ctx[11]);
    			}

    			if (dirty[0] & /*$threshold_clust*/ 1024) {
    				set_input_value(input3, /*$threshold_clust*/ ctx[10]);
    			}

    			if (dirty[0] & /*$domain_min*/ 4096 && to_number(input4.value) !== /*$domain_min*/ ctx[12]) {
    				set_input_value(input4, /*$domain_min*/ ctx[12]);
    			}

    			if (dirty[0] & /*$domain_min*/ 4096) {
    				attr_dev(input5, "min", /*$domain_min*/ ctx[12]);
    			}

    			if (dirty[0] & /*$domain_max*/ 8192) {
    				attr_dev(input5, "max", /*$domain_max*/ ctx[13]);
    			}

    			if (dirty[0] & /*$domain_center*/ 16384 && to_number(input5.value) !== /*$domain_center*/ ctx[14]) {
    				set_input_value(input5, /*$domain_center*/ ctx[14]);
    			}

    			if (dirty[0] & /*$domain_max*/ 8192 && to_number(input6.value) !== /*$domain_max*/ ctx[13]) {
    				set_input_value(input6, /*$domain_max*/ ctx[13]);
    			}

    			if (dirty[0] & /*$domain_min*/ 4096) set_data_dev(t34, /*$domain_min*/ ctx[12]);
    			if (dirty[0] & /*$domain_center*/ 16384) set_data_dev(t35, /*$domain_center*/ ctx[14]);
    			if (dirty[0] & /*$domain_max*/ 8192) set_data_dev(t36, /*$domain_max*/ ctx[13]);
    			if (dirty[0] & /*$radius*/ 32768) set_data_dev(t43, /*$radius*/ ctx[15]);

    			if (dirty[0] & /*$radius*/ 32768) {
    				set_input_value(input7, /*$radius*/ ctx[15]);
    			}

    			if (dirty[0] & /*color_options_nodes*/ 8) {
    				each_value_1 = /*color_options_nodes*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*$color_method_nodes, color_options_nodes*/ 65544) {
    				select_option(select1, /*$color_method_nodes*/ ctx[16]);
    			}

    			if (dirty[0] & /*$edge_width*/ 131072) set_data_dev(t52, /*$edge_width*/ ctx[17]);

    			if (dirty[0] & /*$edge_width*/ 131072) {
    				set_input_value(input8, /*$edge_width*/ ctx[17]);
    			}

    			if (dirty[0] & /*color_options_edges*/ 16) {
    				each_value = /*color_options_edges*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*$color_method_edges, color_options_edges*/ 262160) {
    				select_option(select2, /*$color_method_edges*/ ctx[18]);
    			}

    			if (dirty[0] & /*$toggle_sidebar*/ 128) {
    				toggle_class(div22, "toggled", /*$toggle_sidebar*/ ctx[7]);
    			}
    		},
    		i: noop$2,
    		o: noop$2,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div22);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*button3_binding*/ ctx[44](null);
    			/*button4_binding*/ ctx[45](null);
    			/*button5_binding*/ ctx[46](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $_data_2;
    	let $_data;
    	let $simulationPause;
    	let $renderVisuals;
    	let $link_variables;
    	let $node_variables;
    	let $toggle_sidebar;
    	let $threshold_edges;
    	let $linkage;
    	let $threshold_clust;
    	let $maxDepth;
    	let $domain_min;
    	let $domain_max;
    	let $domain_center;
    	let $radius;
    	let $color_method_nodes;
    	let $edge_width;
    	let $color_method_edges;
    	validate_store(_data_2, '_data_2');
    	component_subscribe($$self, _data_2, $$value => $$invalidate(51, $_data_2 = $$value));
    	validate_store(_data, '_data');
    	component_subscribe($$self, _data, $$value => $$invalidate(52, $_data = $$value));
    	validate_store(simulationPause, 'simulationPause');
    	component_subscribe($$self, simulationPause, $$value => $$invalidate(28, $simulationPause = $$value));
    	validate_store(renderVisuals, 'renderVisuals');
    	component_subscribe($$self, renderVisuals, $$value => $$invalidate(29, $renderVisuals = $$value));
    	validate_store(link_variables, 'link_variables');
    	component_subscribe($$self, link_variables, $$value => $$invalidate(30, $link_variables = $$value));
    	validate_store(node_variables, 'node_variables');
    	component_subscribe($$self, node_variables, $$value => $$invalidate(31, $node_variables = $$value));
    	validate_store(toggle_sidebar, 'toggle_sidebar');
    	component_subscribe($$self, toggle_sidebar, $$value => $$invalidate(7, $toggle_sidebar = $$value));
    	validate_store(threshold_edges, 'threshold_edges');
    	component_subscribe($$self, threshold_edges, $$value => $$invalidate(8, $threshold_edges = $$value));
    	validate_store(linkage, 'linkage');
    	component_subscribe($$self, linkage, $$value => $$invalidate(9, $linkage = $$value));
    	validate_store(threshold_clust, 'threshold_clust');
    	component_subscribe($$self, threshold_clust, $$value => $$invalidate(10, $threshold_clust = $$value));
    	validate_store(maxDepth, 'maxDepth');
    	component_subscribe($$self, maxDepth, $$value => $$invalidate(11, $maxDepth = $$value));
    	validate_store(domain_min, 'domain_min');
    	component_subscribe($$self, domain_min, $$value => $$invalidate(12, $domain_min = $$value));
    	validate_store(domain_max, 'domain_max');
    	component_subscribe($$self, domain_max, $$value => $$invalidate(13, $domain_max = $$value));
    	validate_store(domain_center, 'domain_center');
    	component_subscribe($$self, domain_center, $$value => $$invalidate(14, $domain_center = $$value));
    	validate_store(radius, 'radius');
    	component_subscribe($$self, radius, $$value => $$invalidate(15, $radius = $$value));
    	validate_store(color_method_nodes, 'color_method_nodes');
    	component_subscribe($$self, color_method_nodes, $$value => $$invalidate(16, $color_method_nodes = $$value));
    	validate_store(edge_width, 'edge_width');
    	component_subscribe($$self, edge_width, $$value => $$invalidate(17, $edge_width = $$value));
    	validate_store(color_method_edges, 'color_method_edges');
    	component_subscribe($$self, color_method_edges, $$value => $$invalidate(18, $color_method_edges = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	const cluster_methods = ["none", "single", "complete", "average"];
    	let color_options_nodes = ["fixed", "clusters"];
    	let color_options_edges = ["fixed"];

    	// Togglers
    	let root, expand_clust, expand_styling_matrix, expand_styling_graph;

    	onMount(() => {
    		root = document.querySelector(":root");
    	});

    	function toggle_clust() {
    		if (!expand_clust) {
    			root.style.setProperty("--arrow-item-1-transformation", 'rotate(90deg)');
    			expand_clust = !expand_clust;
    		} else {
    			root.style.setProperty("--arrow-item-1-transformation", 'rotate(0)');
    			expand_clust = !expand_clust;
    		}
    	}

    	function toggle_styling_matrix() {
    		if (!expand_styling_matrix) {
    			root.style.setProperty("--arrow-item-2-transformation", 'rotate(90deg)');
    			expand_styling_matrix = !expand_styling_matrix;
    		} else {
    			root.style.setProperty("--arrow-item-2-transformation", 'rotate(0)');
    			expand_styling_matrix = !expand_styling_matrix;
    		}
    	}

    	function toggle_styling_graph() {
    		if (!expand_styling_graph) {
    			root.style.setProperty("--arrow-item-3-transformation", 'rotate(90deg)');
    			expand_styling_graph = !expand_styling_graph;
    		} else {
    			root.style.setProperty("--arrow-item-3-transformation", 'rotate(0)');
    			expand_styling_graph = !expand_styling_graph;
    		}
    	}

    	// Buttons
    	let run_btn, pause_btn, reset_btn;

    	function eventHandler_runBtn() {
    		$$invalidate(5, run_btn.disabled = true, run_btn);
    		$$invalidate(0, pause_btn.disabled = false, pause_btn);
    		$$invalidate(6, reset_btn.disabled = false, reset_btn);
    		set_store_value(renderVisuals, $renderVisuals = true, $renderVisuals);
    		set_store_value(simulationPause, $simulationPause = false, $simulationPause);
    	}

    	function eventHandler_pauseBtn() {
    		$$invalidate(5, run_btn.disabled = false, run_btn);
    		$$invalidate(0, pause_btn.disabled = true, pause_btn);
    		$$invalidate(6, reset_btn.disabled = false, reset_btn);
    		set_store_value(simulationPause, $simulationPause = true, $simulationPause);
    	}

    	function eventHandler_resetBtn() {
    		$$invalidate(5, run_btn.disabled = false, run_btn);
    		$$invalidate(0, pause_btn.disabled = true, pause_btn);
    		$$invalidate(6, reset_btn.disabled = true, reset_btn);
    		set_store_value(renderVisuals, $renderVisuals = false, $renderVisuals);
    	}

    	// Input File, i.e. the json visuals, but check how to change dendrogram in other input data!
    	let file;

    	let file_dendrogram;
    	const reader = new FileReader();

    	reader.onload = function (event) {
    		set_store_value(_data, $_data = JSON.parse(event.target.result), $_data);
    		$$invalidate(5, run_btn.disabled = false, run_btn);
    	};

    	reader.onprogress = function (event) {
    		if (event.loaded && event.total) {
    			const percent = event.loaded / event.total * 100;
    			console.log(`Loaded: ${Math.round(percent)}%`);
    		}
    	};

    	const reader_2 = new FileReader();

    	reader_2.onload = function (event) {
    		set_store_value(_data_2, $_data_2 = csvToArray(event.target.result), $_data_2);
    		$$invalidate(5, run_btn.disabled = false, run_btn);
    	};

    	reader_2.onprogress = function (event) {
    		if (event.loaded && event.total) {
    			const percentt = event.loaded / event.total * 100;
    			console.log(`Loaded: ${Math.round(percentt)}%`);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		file = this.files;
    		$$invalidate(1, file);
    	}

    	function input1_change_handler() {
    		file_dendrogram = this.files;
    		$$invalidate(2, file_dendrogram);
    	}

    	function input2_change_input_handler() {
    		$threshold_edges = to_number(this.value);
    		threshold_edges.set($threshold_edges);
    	}

    	function select0_change_handler() {
    		$linkage = select_value(this);
    		linkage.set($linkage);
    		$$invalidate(19, cluster_methods);
    	}

    	function input3_change_input_handler() {
    		$threshold_clust = to_number(this.value);
    		threshold_clust.set($threshold_clust);
    	}

    	function input4_input_handler() {
    		$domain_min = to_number(this.value);
    		domain_min.set($domain_min);
    	}

    	function input5_input_handler() {
    		$domain_center = to_number(this.value);
    		domain_center.set($domain_center);
    	}

    	function input6_input_handler() {
    		$domain_max = to_number(this.value);
    		domain_max.set($domain_max);
    	}

    	function input7_change_input_handler() {
    		$radius = to_number(this.value);
    		radius.set($radius);
    	}

    	function select1_change_handler() {
    		$color_method_nodes = select_value(this);
    		color_method_nodes.set($color_method_nodes);
    		($$invalidate(3, color_options_nodes), $$invalidate(31, $node_variables));
    	}

    	function input8_change_input_handler() {
    		$edge_width = to_number(this.value);
    		edge_width.set($edge_width);
    	}

    	function select2_change_handler() {
    		$color_method_edges = select_value(this);
    		color_method_edges.set($color_method_edges);
    		($$invalidate(4, color_options_edges), $$invalidate(30, $link_variables));
    	}

    	function button3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			run_btn = $$value;
    			((($$invalidate(5, run_btn), $$invalidate(0, pause_btn)), $$invalidate(29, $renderVisuals)), $$invalidate(28, $simulationPause));
    		});
    	}

    	function button4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			pause_btn = $$value;
    			(($$invalidate(0, pause_btn), $$invalidate(29, $renderVisuals)), $$invalidate(28, $simulationPause));
    		});
    	}

    	function button5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			reset_btn = $$value;
    			$$invalidate(6, reset_btn);
    		});
    	}

    	$$self.$capture_state = () => ({
    		toggle_sidebar,
    		_data,
    		_data_2,
    		threshold_edges,
    		edge_width,
    		threshold_clust,
    		node_variables,
    		link_variables,
    		color_method_nodes,
    		color_method_edges,
    		domain_min,
    		domain_max,
    		domain_center,
    		maxDepth,
    		radius,
    		linkage,
    		renderVisuals,
    		simulationPause,
    		csvToArray,
    		onMount,
    		interpolateRdBu,
    		cluster_methods,
    		color_options_nodes,
    		color_options_edges,
    		root,
    		expand_clust,
    		expand_styling_matrix,
    		expand_styling_graph,
    		toggle_clust,
    		toggle_styling_matrix,
    		toggle_styling_graph,
    		run_btn,
    		pause_btn,
    		reset_btn,
    		eventHandler_runBtn,
    		eventHandler_pauseBtn,
    		eventHandler_resetBtn,
    		file,
    		file_dendrogram,
    		reader,
    		reader_2,
    		$_data_2,
    		$_data,
    		$simulationPause,
    		$renderVisuals,
    		$link_variables,
    		$node_variables,
    		$toggle_sidebar,
    		$threshold_edges,
    		$linkage,
    		$threshold_clust,
    		$maxDepth,
    		$domain_min,
    		$domain_max,
    		$domain_center,
    		$radius,
    		$color_method_nodes,
    		$edge_width,
    		$color_method_edges
    	});

    	$$self.$inject_state = $$props => {
    		if ('color_options_nodes' in $$props) $$invalidate(3, color_options_nodes = $$props.color_options_nodes);
    		if ('color_options_edges' in $$props) $$invalidate(4, color_options_edges = $$props.color_options_edges);
    		if ('root' in $$props) root = $$props.root;
    		if ('expand_clust' in $$props) expand_clust = $$props.expand_clust;
    		if ('expand_styling_matrix' in $$props) expand_styling_matrix = $$props.expand_styling_matrix;
    		if ('expand_styling_graph' in $$props) expand_styling_graph = $$props.expand_styling_graph;
    		if ('run_btn' in $$props) $$invalidate(5, run_btn = $$props.run_btn);
    		if ('pause_btn' in $$props) $$invalidate(0, pause_btn = $$props.pause_btn);
    		if ('reset_btn' in $$props) $$invalidate(6, reset_btn = $$props.reset_btn);
    		if ('file' in $$props) $$invalidate(1, file = $$props.file);
    		if ('file_dendrogram' in $$props) $$invalidate(2, file_dendrogram = $$props.file_dendrogram);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[1] & /*$node_variables*/ 1) {
    			$$invalidate(3, color_options_nodes = ["fixed", "clusters", ...$node_variables]);
    		}

    		if ($$self.$$.dirty[0] & /*$link_variables*/ 1073741824) {
    			$$invalidate(4, color_options_edges = ["fixed", ...$link_variables]);
    		}

    		if ($$self.$$.dirty[0] & /*pause_btn, $renderVisuals, $simulationPause*/ 805306369) {
    			{
    				if (pause_btn) {
    					if ($renderVisuals) {
    						$$invalidate(0, pause_btn.disabled = $simulationPause ? true : false, pause_btn);
    						$$invalidate(5, run_btn.disabled = $simulationPause ? false : true, run_btn);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*file*/ 2) {
    			console.log(file);
    		}

    		if ($$self.$$.dirty[0] & /*file_dendrogram*/ 4) {
    			console.log(file_dendrogram);
    		}

    		if ($$self.$$.dirty[0] & /*file, reader*/ 67108866) {
    			{
    				if (file) {
    					if (file.length > 0) {
    						reader.readAsText(file[0]);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*file_dendrogram, reader_2*/ 134217732) {
    			{
    				if (file_dendrogram) {
    					if (file_dendrogram.length > 0) {
    						reader_2.readAsText(file_dendrogram[0]);
    					}
    				}
    			}
    		}
    	};

    	return [
    		pause_btn,
    		file,
    		file_dendrogram,
    		color_options_nodes,
    		color_options_edges,
    		run_btn,
    		reset_btn,
    		$toggle_sidebar,
    		$threshold_edges,
    		$linkage,
    		$threshold_clust,
    		$maxDepth,
    		$domain_min,
    		$domain_max,
    		$domain_center,
    		$radius,
    		$color_method_nodes,
    		$edge_width,
    		$color_method_edges,
    		cluster_methods,
    		toggle_clust,
    		toggle_styling_matrix,
    		toggle_styling_graph,
    		eventHandler_runBtn,
    		eventHandler_pauseBtn,
    		eventHandler_resetBtn,
    		reader,
    		reader_2,
    		$simulationPause,
    		$renderVisuals,
    		$link_variables,
    		$node_variables,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_input_handler,
    		select0_change_handler,
    		input3_change_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_change_input_handler,
    		select1_change_handler,
    		input8_change_input_handler,
    		select2_change_handler,
    		button3_binding,
    		button4_binding,
    		button5_binding
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\_components\Navbar.svelte generated by Svelte v3.49.0 */
    const file$4 = "src\\_components\\Navbar.svelte";

    function create_fragment$4(ctx) {
    	let nav;
    	let div0;
    	let i0;
    	let t0;
    	let div7;
    	let button0;
    	let t2;
    	let a;
    	let i1;
    	let t3;
    	let div6;
    	let div5;
    	let div4;
    	let div1;
    	let h3;
    	let t5;
    	let button1;
    	let t6;
    	let div2;
    	let h40;
    	let t8;
    	let p0;
    	let t10;
    	let h41;
    	let t12;
    	let p1;
    	let t14;
    	let table;
    	let thead0;
    	let tr0;
    	let th0;
    	let t16;
    	let tbody0;
    	let tr1;
    	let td0;
    	let t18;
    	let td1;
    	let t19;
    	let sup0;
    	let t21;
    	let t22;
    	let tr2;
    	let td2;
    	let t24;
    	let td3;
    	let t25;
    	let sup1;
    	let t27;
    	let t28;
    	let tr3;
    	let td4;
    	let t30;
    	let td5;
    	let t31;
    	let sup2;
    	let t33;
    	let t34;
    	let thead1;
    	let tr4;
    	let th1;
    	let t36;
    	let tbody1;
    	let tr5;
    	let td6;
    	let t38;
    	let td7;
    	let t40;
    	let tr6;
    	let td8;
    	let t42;
    	let td9;
    	let t44;
    	let thead2;
    	let tr7;
    	let th2;
    	let t46;
    	let tbody2;
    	let tr8;
    	let th3;
    	let t48;
    	let tr9;
    	let td10;
    	let t50;
    	let td11;
    	let t52;
    	let tr10;
    	let td12;
    	let t54;
    	let td13;
    	let t56;
    	let tr11;
    	let td14;
    	let t58;
    	let td15;
    	let t60;
    	let thead3;
    	let tr12;
    	let th4;
    	let t62;
    	let tbody3;
    	let tr13;
    	let th5;
    	let t64;
    	let tr14;
    	let td16;
    	let t66;
    	let td17;
    	let t68;
    	let tr15;
    	let td18;
    	let t70;
    	let td19;
    	let t72;
    	let tr16;
    	let th6;
    	let t74;
    	let tr17;
    	let td20;
    	let t76;
    	let td21;
    	let t78;
    	let tr18;
    	let td22;
    	let t80;
    	let td23;
    	let t82;
    	let sup3;
    	let t84;
    	let h42;
    	let t86;
    	let p2;
    	let t87;
    	let code0;
    	let t89;
    	let t90;
    	let pre0;
    	let t91;
    	let code1;
    	let t95;
    	let t96;
    	let h60;
    	let t98;
    	let p3;
    	let t99;
    	let code2;
    	let t101;
    	let code3;
    	let t103;
    	let code4;
    	let t105;
    	let code5;
    	let t107;
    	let code6;
    	let t109;
    	let code7;
    	let t111;
    	let t112;
    	let pre1;
    	let t113;
    	let code8;
    	let t116;
    	let t117;
    	let h61;
    	let t119;
    	let p4;
    	let t120;
    	let code9;
    	let t122;
    	let code10;
    	let t124;
    	let code11;
    	let t126;
    	let code12;
    	let t128;
    	let code13;
    	let t130;
    	let code14;
    	let t132;
    	let t133;
    	let pre2;
    	let t134;
    	let code15;
    	let t137;
    	let t138;
    	let div3;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div7 = element("div");
    			button0 = element("button");
    			button0.textContent = "Docs";
    			t2 = space();
    			a = element("a");
    			i1 = element("i");
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "MOBS - Multi-Omics Brush for Subgraph visualisation";
    			t5 = space();
    			button1 = element("button");
    			t6 = space();
    			div2 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Abstract";
    			t8 = space();
    			p0 = element("p");
    			p0.textContent = "One of the big opportunities in multi-omics analysis is the identification of interactions between molecular entities and their association with diseases. In analyzing and expressing these interactions in the search for new hypotheses, multi-omics data is often either translated into matrices containing pairwise correlations and distances, or visualized as node-link diagrams. A major problem when visualizing large networks however is the occurrence of hairball-like graphs, from which little to none information can be extracted. It is of interest to investigate subgroups of markers that are closely associated with each other, rather than just looking at the overload of all interactions. An interface that draws subnetworks based on user interaction greatly helps in enabling comprehensible, detailed analyses.";
    			t10 = space();
    			h41 = element("h4");
    			h41.textContent = "User interface";
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "MOBS was designed with various functionalities that enable efficient analyses, and includes several interactive features to optimize the user experience.";
    			t14 = space();
    			table = element("table");
    			thead0 = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Buttons";
    			t16 = space();
    			tbody0 = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Run";
    			t18 = space();
    			td1 = element("td");
    			t19 = text("Start simulation algorithm");
    			sup0 = element("sup");
    			sup0.textContent = "1";
    			t21 = text(" and draw visualisations.");
    			t22 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			td2.textContent = "Pause";
    			t24 = space();
    			td3 = element("td");
    			t25 = text("Pause simulation algorithm");
    			sup1 = element("sup");
    			sup1.textContent = "1";
    			t27 = text(" to keep current layout in the node-link diagram (Graph).");
    			t28 = space();
    			tr3 = element("tr");
    			td4 = element("td");
    			td4.textContent = "Reset";
    			t30 = space();
    			td5 = element("td");
    			t31 = text("Remove the visualizations from the screen en reset the simulation algorithm");
    			sup2 = element("sup");
    			sup2.textContent = "1";
    			t33 = text(".");
    			t34 = space();
    			thead1 = element("thead");
    			tr4 = element("tr");
    			th1 = element("th");
    			th1.textContent = "Clustering";
    			t36 = space();
    			tbody1 = element("tbody");
    			tr5 = element("tr");
    			td6 = element("td");
    			td6.textContent = "Select clustering";
    			t38 = space();
    			td7 = element("td");
    			td7.textContent = "Select the type of hierarchical clustering you want to apply on the data. Options include: single, complete, and average. Default is none.";
    			t40 = space();
    			tr6 = element("tr");
    			td8 = element("td");
    			td8.textContent = "Threshold clustering";
    			t42 = space();
    			td9 = element("td");
    			td9.textContent = "Select the clustering depth that clusters can be formed in.";
    			t44 = space();
    			thead2 = element("thead");
    			tr7 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Matrix Styling";
    			t46 = space();
    			tbody2 = element("tbody");
    			tr8 = element("tr");
    			th3 = element("th");
    			th3.textContent = "Domain colorscale";
    			t48 = space();
    			tr9 = element("tr");
    			td10 = element("td");
    			td10.textContent = "Min value";
    			t50 = space();
    			td11 = element("td");
    			td11.textContent = "Define minimum value for the domain of the color scale applied on edge values (weights).";
    			t52 = space();
    			tr10 = element("tr");
    			td12 = element("td");
    			td12.textContent = "Center value";
    			t54 = space();
    			td13 = element("td");
    			td13.textContent = "Define center value for the domain of the color scale applied on edge values (weights).";
    			t56 = space();
    			tr11 = element("tr");
    			td14 = element("td");
    			td14.textContent = "Max value";
    			t58 = space();
    			td15 = element("td");
    			td15.textContent = "Define maximum value for the domain of the color scale applied on edge values (weights).";
    			t60 = space();
    			thead3 = element("thead");
    			tr12 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Graph Styling";
    			t62 = space();
    			tbody3 = element("tbody");
    			tr13 = element("tr");
    			th5 = element("th");
    			th5.textContent = "Nodes";
    			t64 = space();
    			tr14 = element("tr");
    			td16 = element("td");
    			td16.textContent = "Radius";
    			t66 = space();
    			td17 = element("td");
    			td17.textContent = "Define node radius.";
    			t68 = space();
    			tr15 = element("tr");
    			td18 = element("td");
    			td18.textContent = "Color variable";
    			t70 = space();
    			td19 = element("td");
    			td19.textContent = "Select variable to use for node coloring.";
    			t72 = space();
    			tr16 = element("tr");
    			th6 = element("th");
    			th6.textContent = "Edges";
    			t74 = space();
    			tr17 = element("tr");
    			td20 = element("td");
    			td20.textContent = "Width";
    			t76 = space();
    			td21 = element("td");
    			td21.textContent = "Define edge width.";
    			t78 = space();
    			tr18 = element("tr");
    			td22 = element("td");
    			td22.textContent = "Color variable";
    			t80 = space();
    			td23 = element("td");
    			td23.textContent = "Select variable to use for link coloring.";
    			t82 = space();
    			sup3 = element("sup");
    			sup3.textContent = "1. The simulation algorithm calculates the optimal position of the nodes based on a set of predefined forces, and hence determines the layout of the node-link diagram by constantly repositioning the nodes untill saturation is reached.";
    			t84 = space();
    			h42 = element("h4");
    			h42.textContent = "Data requirements";
    			t86 = space();
    			p2 = element("p");
    			t87 = text("The input data needs to be off the format ");
    			code0 = element("code");
    			code0.textContent = ".json";
    			t89 = text(", and contains the following arrays with values:");
    			t90 = space();
    			pre0 = element("pre");
    			t91 = text("                        ");
    			code1 = element("code");

    			code1.textContent = `
                            ${/*_dataFormat*/ ctx[1]}
                        `;

    			t95 = text("\n                    ");
    			t96 = space();
    			h60 = element("h6");
    			h60.textContent = "R json formatter";
    			t98 = space();
    			p3 = element("p");
    			t99 = text("In R, the ");
    			code2 = element("code");
    			code2.textContent = "jsonlite";
    			t101 = text(" package allows us to use the function ");
    			code3 = element("code");
    			code3.textContent = "toJSON()";
    			t103 = text(" and ");
    			code4 = element("code");
    			code4.textContent = "fromJSON";
    			t105 = text(" to parse JSON formats. Using ");
    			code5 = element("code");
    			code5.textContent = "write_json(fromJSON(toJSON(df)), \"C:/location/df.json\")";
    			t107 = text(", we can write any dataframe to ");
    			code6 = element("code");
    			code6.textContent = ".json";
    			t109 = text(". Here is an example of how to transform a correlation matrix into a node link diagram and store it as a ");
    			code7 = element("code");
    			code7.textContent = ".json";
    			t111 = text(" file:");
    			t112 = space();
    			pre1 = element("pre");
    			t113 = text("                        ");
    			code8 = element("code");

    			code8.textContent = `${`
# Load Data
data(mtcars)

# Compute correlation matrix
correlation_matrix = cor(mtcars)

# Generate edge list
links = data.frame("source" = character(), 
                   "target" = character(), 
                   "value" = integer(), 
                   stringsAsFactors = FALSE)
i = 0
for(s in colnames(correlation_matrix)) {
  for(t in colnames(correlation_matrix)) {
    links[i,c("source")] = s 
    links[i,c("target")] = t
    links[i,c("value")] = correlation_matrix[c(s),c(t)]
    i = i + 1
  }
}

# Generate node list
nodes = data.frame(id = seq(from=0, to=length(colnames(correlation_matrix))-1, by=1), 
                   label = colnames(correlation_matrix), 
                   stringsAsFactors = FALSE)

# Generate node link file
graph = list(nodes = nodes, links = links)

library(jsonlite)
graph_json = toJSON(graph, pretty = TRUE)
write_json(fromJSON(graph_json), "C:/location/example.json")`}
                        `;

    			t116 = text("\n                    ");
    			t117 = space();
    			h61 = element("h6");
    			h61.textContent = "Python json formatter";
    			t119 = space();
    			p4 = element("p");
    			t120 = text("In Python, we can use ");
    			code9 = element("code");
    			code9.textContent = "pandas";
    			t122 = text(" to transform dataframes into dictionaries, using ");
    			code10 = element("code");
    			code10.textContent = "to_dict()";
    			t124 = text(". Hence, ");
    			code11 = element("code");
    			code11.textContent = "json";
    			t126 = text(" formats are easy to construct and can be stored in a local ");
    			code12 = element("code");
    			code12.textContent = ".json";
    			t128 = text(" file using ");
    			code13 = element("code");
    			code13.textContent = "json.dump()";
    			t130 = text(". Here is an example of how to transform a correlation matrix into a node link diagram and store it as a ");
    			code14 = element("code");
    			code14.textContent = ".json";
    			t132 = text(" file:");
    			t133 = space();
    			pre2 = element("pre");
    			t134 = text("                        ");
    			code15 = element("code");

    			code15.textContent = `${`
import pandas as pd
import seaborn as sns
import numpy as np
import json

# Load Data
df = sns.load_dataset('iris')

# Compute correlation matrix
correlation_matrix = df[["sepal_length", "sepal_width", "petal_length", "petal_width"]].corr()

# Generate edge list
links = correlation_matrix.stack().reset_index()
links.columns = ["source", "target", "value"]

# Generate node list
nodes = pd.DataFrame(data={'id': np.arange(len(correlation_matrix.columns), dtype=int), 
                           'label': list(correlation_matrix.columns)})

# Generate node link file
graph = {'nodes': nodes.to_dict(orient='records'), 'links': links.to_dict(orient='records')}

with open('example.json', 'w') as f:
    json.dump(graph, f)`}
                        `;

    			t137 = text("\n                    ");
    			t138 = space();
    			div3 = element("div");
    			button2 = element("button");
    			button2.textContent = "Close";
    			attr_dev(i0, "class", "fas fa-align-left text-dark fs-4 me-3 svelte-1jkownc");
    			attr_dev(i0, "id", "menu-toggle");
    			add_location(i0, file$4, 11, 8, 429);
    			attr_dev(div0, "class", "d-flex align-items-center");
    			add_location(div0, file$4, 10, 4, 381);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-link link-text me-3 svelte-1jkownc");
    			attr_dev(button0, "data-bs-toggle", "modal");
    			attr_dev(button0, "data-bs-target", "#exampleModalLong");
    			add_location(button0, file$4, 15, 8, 619);
    			attr_dev(i1, "class", "fab fa-github");
    			add_location(i1, file$4, 17, 12, 924);
    			attr_dev(a, "href", "https://github.com/driesheylen123/Multi_omics_exploration");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			attr_dev(a, "class", "d-flex align-items-center link-text svelte-1jkownc");
    			add_location(a, file$4, 16, 8, 757);
    			attr_dev(h3, "class", "modal-title");
    			attr_dev(h3, "id", "exampleModalLongTitle");
    			add_location(h3, file$4, 25, 20, 1324);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn-close");
    			attr_dev(button1, "data-bs-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$4, 26, 20, 1452);
    			attr_dev(div1, "class", "modal-header");
    			add_location(div1, file$4, 24, 16, 1277);
    			add_location(h40, file$4, 29, 20, 1629);
    			add_location(p0, file$4, 30, 20, 1667);
    			add_location(h41, file$4, 31, 20, 2512);
    			add_location(p1, file$4, 32, 20, 2556);
    			add_location(th0, file$4, 36, 32, 2856);
    			add_location(tr0, file$4, 35, 28, 2819);
    			add_location(thead0, file$4, 34, 24, 2783);
    			add_location(td0, file$4, 41, 32, 3037);
    			add_location(sup0, file$4, 42, 62, 3112);
    			add_location(td1, file$4, 42, 32, 3082);
    			add_location(tr1, file$4, 40, 28, 3000);
    			add_location(td2, file$4, 45, 32, 3254);
    			add_location(sup1, file$4, 46, 62, 3331);
    			add_location(td3, file$4, 46, 32, 3301);
    			add_location(tr2, file$4, 44, 28, 3217);
    			add_location(td4, file$4, 49, 32, 3505);
    			add_location(sup2, file$4, 50, 111, 3631);
    			add_location(td5, file$4, 50, 32, 3552);
    			add_location(tr3, file$4, 48, 28, 3468);
    			add_location(tbody0, file$4, 39, 24, 2964);
    			add_location(th1, file$4, 55, 32, 3814);
    			add_location(tr4, file$4, 54, 28, 3777);
    			add_location(thead1, file$4, 53, 24, 3741);
    			add_location(td6, file$4, 60, 32, 3998);
    			add_location(td7, file$4, 61, 32, 4057);
    			add_location(tr5, file$4, 59, 28, 3961);
    			add_location(td8, file$4, 64, 32, 4308);
    			add_location(td9, file$4, 65, 32, 4370);
    			add_location(tr6, file$4, 63, 28, 4271);
    			add_location(tbody1, file$4, 58, 24, 3925);
    			add_location(th2, file$4, 70, 32, 4603);
    			add_location(tr7, file$4, 69, 28, 4566);
    			add_location(thead2, file$4, 68, 24, 4530);
    			add_location(th3, file$4, 75, 32, 4791);
    			add_location(tr8, file$4, 74, 28, 4754);
    			add_location(td10, file$4, 78, 32, 4917);
    			add_location(td11, file$4, 79, 32, 4968);
    			add_location(tr9, file$4, 77, 28, 4880);
    			add_location(td12, file$4, 82, 32, 5165);
    			add_location(td13, file$4, 83, 32, 5219);
    			add_location(tr10, file$4, 81, 28, 5128);
    			add_location(td14, file$4, 86, 32, 5415);
    			add_location(td15, file$4, 87, 32, 5466);
    			add_location(tr11, file$4, 85, 28, 5378);
    			add_location(tbody2, file$4, 73, 24, 4718);
    			add_location(th4, file$4, 92, 32, 5728);
    			add_location(tr12, file$4, 91, 28, 5691);
    			add_location(thead3, file$4, 90, 24, 5655);
    			add_location(th5, file$4, 97, 32, 5915);
    			add_location(tr13, file$4, 96, 28, 5878);
    			add_location(td16, file$4, 100, 32, 6029);
    			add_location(td17, file$4, 101, 32, 6077);
    			add_location(tr14, file$4, 99, 28, 5992);
    			add_location(td18, file$4, 104, 32, 6205);
    			add_location(td19, file$4, 105, 32, 6261);
    			add_location(tr15, file$4, 103, 28, 6168);
    			add_location(th6, file$4, 108, 32, 6411);
    			add_location(tr16, file$4, 107, 28, 6374);
    			add_location(td20, file$4, 111, 32, 6525);
    			add_location(td21, file$4, 112, 32, 6572);
    			add_location(tr17, file$4, 110, 28, 6488);
    			add_location(td22, file$4, 115, 32, 6699);
    			add_location(td23, file$4, 116, 32, 6755);
    			add_location(tr18, file$4, 114, 28, 6662);
    			add_location(tbody3, file$4, 95, 24, 5842);
    			attr_dev(table, "class", "table");
    			add_location(table, file$4, 33, 20, 2737);
    			attr_dev(sup3, "id", "fn1");
    			add_location(sup3, file$4, 120, 20, 6922);
    			add_location(h42, file$4, 121, 20, 7197);
    			add_location(code0, file$4, 122, 65, 7289);
    			add_location(p2, file$4, 122, 20, 7244);
    			attr_dev(code1, "class", "json");
    			add_location(code1, file$4, 125, 24, 7503);
    			add_location(pre0, file$4, 124, 20, 7473);
    			add_location(h60, file$4, 129, 20, 7644);
    			add_location(code2, file$4, 130, 33, 7703);
    			add_location(code3, file$4, 130, 93, 7763);
    			add_location(code4, file$4, 130, 119, 7789);
    			add_location(code5, file$4, 130, 170, 7840);
    			add_location(code6, file$4, 130, 270, 7940);
    			add_location(code7, file$4, 130, 393, 8063);
    			add_location(p3, file$4, 130, 20, 7690);
    			attr_dev(code8, "class", "r");
    			add_location(code8, file$4, 132, 24, 8142);
    			add_location(pre1, file$4, 131, 20, 8112);
    			add_location(h61, file$4, 167, 20, 9155);
    			add_location(code9, file$4, 168, 45, 9231);
    			add_location(code10, file$4, 168, 114, 9300);
    			add_location(code11, file$4, 168, 145, 9331);
    			add_location(code12, file$4, 168, 222, 9408);
    			add_location(code13, file$4, 168, 252, 9438);
    			add_location(code14, file$4, 168, 381, 9567);
    			add_location(p4, file$4, 168, 20, 9206);
    			attr_dev(code15, "class", "python");
    			add_location(code15, file$4, 170, 24, 9646);
    			add_location(pre2, file$4, 169, 20, 9616);
    			attr_dev(div2, "class", "modal-body");
    			add_location(div2, file$4, 28, 16, 1584);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-secondary");
    			attr_dev(button2, "data-bs-dismiss", "modal");
    			add_location(button2, file$4, 199, 20, 10555);
    			attr_dev(div3, "class", "modal-footer");
    			add_location(div3, file$4, 198, 16, 10508);
    			attr_dev(div4, "class", "modal-content");
    			add_location(div4, file$4, 23, 12, 1233);
    			attr_dev(div5, "class", "modal-dialog modal-dialog-scrollable modal-lg");
    			attr_dev(div5, "role", "document");
    			add_location(div5, file$4, 22, 12, 1145);
    			attr_dev(div6, "class", "modal fade");
    			attr_dev(div6, "id", "exampleModalLong");
    			attr_dev(div6, "tabindex", "-1");
    			attr_dev(div6, "role", "dialog");
    			attr_dev(div6, "aria-labelledby", "exampleModalLongTitle");
    			attr_dev(div6, "aria-hidden", "true");
    			add_location(div6, file$4, 21, 8, 999);
    			attr_dev(div7, "class", "d-flex align-items-center");
    			add_location(div7, file$4, 14, 4, 571);
    			attr_dev(nav, "class", "navbar navbar-expand-lg justify-content-between navbar-light bg-transparent py-4 px-4");
    			add_location(nav, file$4, 9, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, i0);
    			append_dev(nav, t0);
    			append_dev(nav, div7);
    			append_dev(div7, button0);
    			append_dev(div7, t2);
    			append_dev(div7, a);
    			append_dev(a, i1);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div2, h40);
    			append_dev(div2, t8);
    			append_dev(div2, p0);
    			append_dev(div2, t10);
    			append_dev(div2, h41);
    			append_dev(div2, t12);
    			append_dev(div2, p1);
    			append_dev(div2, t14);
    			append_dev(div2, table);
    			append_dev(table, thead0);
    			append_dev(thead0, tr0);
    			append_dev(tr0, th0);
    			append_dev(table, t16);
    			append_dev(table, tbody0);
    			append_dev(tbody0, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t18);
    			append_dev(tr1, td1);
    			append_dev(td1, t19);
    			append_dev(td1, sup0);
    			append_dev(td1, t21);
    			append_dev(tbody0, t22);
    			append_dev(tbody0, tr2);
    			append_dev(tr2, td2);
    			append_dev(tr2, t24);
    			append_dev(tr2, td3);
    			append_dev(td3, t25);
    			append_dev(td3, sup1);
    			append_dev(td3, t27);
    			append_dev(tbody0, t28);
    			append_dev(tbody0, tr3);
    			append_dev(tr3, td4);
    			append_dev(tr3, t30);
    			append_dev(tr3, td5);
    			append_dev(td5, t31);
    			append_dev(td5, sup2);
    			append_dev(td5, t33);
    			append_dev(table, t34);
    			append_dev(table, thead1);
    			append_dev(thead1, tr4);
    			append_dev(tr4, th1);
    			append_dev(table, t36);
    			append_dev(table, tbody1);
    			append_dev(tbody1, tr5);
    			append_dev(tr5, td6);
    			append_dev(tr5, t38);
    			append_dev(tr5, td7);
    			append_dev(tbody1, t40);
    			append_dev(tbody1, tr6);
    			append_dev(tr6, td8);
    			append_dev(tr6, t42);
    			append_dev(tr6, td9);
    			append_dev(table, t44);
    			append_dev(table, thead2);
    			append_dev(thead2, tr7);
    			append_dev(tr7, th2);
    			append_dev(table, t46);
    			append_dev(table, tbody2);
    			append_dev(tbody2, tr8);
    			append_dev(tr8, th3);
    			append_dev(tbody2, t48);
    			append_dev(tbody2, tr9);
    			append_dev(tr9, td10);
    			append_dev(tr9, t50);
    			append_dev(tr9, td11);
    			append_dev(tbody2, t52);
    			append_dev(tbody2, tr10);
    			append_dev(tr10, td12);
    			append_dev(tr10, t54);
    			append_dev(tr10, td13);
    			append_dev(tbody2, t56);
    			append_dev(tbody2, tr11);
    			append_dev(tr11, td14);
    			append_dev(tr11, t58);
    			append_dev(tr11, td15);
    			append_dev(table, t60);
    			append_dev(table, thead3);
    			append_dev(thead3, tr12);
    			append_dev(tr12, th4);
    			append_dev(table, t62);
    			append_dev(table, tbody3);
    			append_dev(tbody3, tr13);
    			append_dev(tr13, th5);
    			append_dev(tbody3, t64);
    			append_dev(tbody3, tr14);
    			append_dev(tr14, td16);
    			append_dev(tr14, t66);
    			append_dev(tr14, td17);
    			append_dev(tbody3, t68);
    			append_dev(tbody3, tr15);
    			append_dev(tr15, td18);
    			append_dev(tr15, t70);
    			append_dev(tr15, td19);
    			append_dev(tbody3, t72);
    			append_dev(tbody3, tr16);
    			append_dev(tr16, th6);
    			append_dev(tbody3, t74);
    			append_dev(tbody3, tr17);
    			append_dev(tr17, td20);
    			append_dev(tr17, t76);
    			append_dev(tr17, td21);
    			append_dev(tbody3, t78);
    			append_dev(tbody3, tr18);
    			append_dev(tr18, td22);
    			append_dev(tr18, t80);
    			append_dev(tr18, td23);
    			append_dev(div2, t82);
    			append_dev(div2, sup3);
    			append_dev(div2, t84);
    			append_dev(div2, h42);
    			append_dev(div2, t86);
    			append_dev(div2, p2);
    			append_dev(p2, t87);
    			append_dev(p2, code0);
    			append_dev(p2, t89);
    			append_dev(div2, t90);
    			append_dev(div2, pre0);
    			append_dev(pre0, t91);
    			append_dev(pre0, code1);
    			append_dev(pre0, t95);
    			append_dev(div2, t96);
    			append_dev(div2, h60);
    			append_dev(div2, t98);
    			append_dev(div2, p3);
    			append_dev(p3, t99);
    			append_dev(p3, code2);
    			append_dev(p3, t101);
    			append_dev(p3, code3);
    			append_dev(p3, t103);
    			append_dev(p3, code4);
    			append_dev(p3, t105);
    			append_dev(p3, code5);
    			append_dev(p3, t107);
    			append_dev(p3, code6);
    			append_dev(p3, t109);
    			append_dev(p3, code7);
    			append_dev(p3, t111);
    			append_dev(div2, t112);
    			append_dev(div2, pre1);
    			append_dev(pre1, t113);
    			append_dev(pre1, code8);
    			append_dev(pre1, t116);
    			append_dev(div2, t117);
    			append_dev(div2, h61);
    			append_dev(div2, t119);
    			append_dev(div2, p4);
    			append_dev(p4, t120);
    			append_dev(p4, code9);
    			append_dev(p4, t122);
    			append_dev(p4, code10);
    			append_dev(p4, t124);
    			append_dev(p4, code11);
    			append_dev(p4, t126);
    			append_dev(p4, code12);
    			append_dev(p4, t128);
    			append_dev(p4, code13);
    			append_dev(p4, t130);
    			append_dev(p4, code14);
    			append_dev(p4, t132);
    			append_dev(div2, t133);
    			append_dev(div2, pre2);
    			append_dev(pre2, t134);
    			append_dev(pre2, code15);
    			append_dev(pre2, t137);
    			append_dev(div4, t138);
    			append_dev(div4, div3);
    			append_dev(div3, button2);

    			if (!mounted) {
    				dispose = listen_dev(i0, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$2,
    		i: noop$2,
    		o: noop$2,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $toggle_sidebar;
    	validate_store(toggle_sidebar, 'toggle_sidebar');
    	component_subscribe($$self, toggle_sidebar, $$value => $$invalidate(0, $toggle_sidebar = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);

    	const _dataFormat = JSON.stringify(
    		{
    			nodes: [{ id: 0, label: "node_A" }, { id: 1, label: "node_B" }],
    			links: [
    				{
    					source: "node_A",
    					target: "node_B",
    					value: "1"
    				}
    			]
    		},
    		null,
    		'\t'
    	);

    	hljs.initHighlightingOnLoad();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(toggle_sidebar, $toggle_sidebar = !$toggle_sidebar, $toggle_sidebar);

    	$$self.$capture_state = () => ({
    		toggle_sidebar,
    		_dataFormat,
    		$toggle_sidebar
    	});

    	return [$toggle_sidebar, _dataFormat, click_handler];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    function initInterpolator(domain, interpolator) {
      switch (arguments.length) {
        case 0: break;
        case 1: {
          if (typeof domain === "function") this.interpolator(domain);
          else this.range(domain);
          break;
        }
        default: {
          this.domain(domain);
          if (typeof interpolator === "function") this.interpolator(interpolator);
          else this.range(interpolator);
          break;
        }
      }
      return this;
    }

    const implicit = Symbol("implicit");

    function ordinal() {
      var index = new InternMap(),
          domain = [],
          range = [],
          unknown = implicit;

      function scale(d) {
        let i = index.get(d);
        if (i === undefined) {
          if (unknown !== implicit) return unknown;
          index.set(d, i = domain.push(d) - 1);
        }
        return range[i % range.length];
      }

      scale.domain = function(_) {
        if (!arguments.length) return domain.slice();
        domain = [], index = new InternMap();
        for (const value of _) {
          if (index.has(value)) continue;
          index.set(value, domain.push(value) - 1);
        }
        return scale;
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), scale) : range.slice();
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      scale.copy = function() {
        return ordinal(domain, range).unknown(unknown);
      };

      initRange.apply(scale, arguments);

      return scale;
    }

    function band() {
      var scale = ordinal().unknown(undefined),
          domain = scale.domain,
          ordinalRange = scale.range,
          r0 = 0,
          r1 = 1,
          step,
          bandwidth,
          round = false,
          paddingInner = 0,
          paddingOuter = 0,
          align = 0.5;

      delete scale.unknown;

      function rescale() {
        var n = domain().length,
            reverse = r1 < r0,
            start = reverse ? r1 : r0,
            stop = reverse ? r0 : r1;
        step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
        if (round) step = Math.floor(step);
        start += (stop - start - step * (n - paddingInner)) * align;
        bandwidth = step * (1 - paddingInner);
        if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
        var values = range(n).map(function(i) { return start + step * i; });
        return ordinalRange(reverse ? values.reverse() : values);
      }

      scale.domain = function(_) {
        return arguments.length ? (domain(_), rescale()) : domain();
      };

      scale.range = function(_) {
        return arguments.length ? ([r0, r1] = _, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
      };

      scale.rangeRound = function(_) {
        return [r0, r1] = _, r0 = +r0, r1 = +r1, round = true, rescale();
      };

      scale.bandwidth = function() {
        return bandwidth;
      };

      scale.step = function() {
        return step;
      };

      scale.round = function(_) {
        return arguments.length ? (round = !!_, rescale()) : round;
      };

      scale.padding = function(_) {
        return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
      };

      scale.paddingInner = function(_) {
        return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
      };

      scale.paddingOuter = function(_) {
        return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
      };

      scale.align = function(_) {
        return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
      };

      scale.copy = function() {
        return band(domain(), [r0, r1])
            .round(round)
            .paddingInner(paddingInner)
            .paddingOuter(paddingOuter)
            .align(align);
      };

      return initRange.apply(rescale(), arguments);
    }

    function constants(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity$1(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constants(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisect(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy$1(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer$2() {
      var domain = unit,
          range = unit,
          interpolate = interpolate$1,
          transform,
          untransform,
          unknown,
          clamp = identity$1,
          piecewise,
          output,
          input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== identity$1) clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = Array.from(_), interpolate = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? true : identity$1, rescale()) : clamp !== identity$1;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate = _, rescale()) : interpolate;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous() {
      return transformer$2()(identity$1, identity$1);
    }

    function formatDecimal(x) {
      return Math.abs(x = Math.round(x)) >= 1e21
          ? x.toLocaleString("en").replace(/,/g, "")
          : x.toString(10);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimalParts(1.23) returns ["123", 0].
    function formatDecimalParts(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": (x, p) => (x * 100).toFixed(p),
      "b": (x) => Math.round(x).toString(2),
      "c": (x) => x + "",
      "d": formatDecimal,
      "e": (x, p) => x.toExponential(p),
      "f": (x, p) => x.toFixed(p),
      "g": (x, p) => x.toPrecision(p),
      "o": (x) => Math.round(x).toString(8),
      "p": (x, p) => formatRounded(x * 100, p),
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": (x) => Math.round(x).toString(16).toUpperCase(),
      "x": (x) => Math.round(x).toString(16)
    };

    function identity(x) {
      return x;
    }

    var map = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity : formatNumerals(map.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "−" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Determine the sign. -0 is not less than 0, but 1 / -0 is!
            var valueNegative = value < 0 || 1 / value < 0;

            // Perform the initial formatting.
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
            if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale;
    var format$1;
    var formatPrefix;

    defaultLocale({
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      format$1 = locale.format;
      formatPrefix = locale.formatPrefix;
      return locale;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format$1(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain();
        var i0 = 0;
        var i1 = d.length - 1;
        var start = d[i0];
        var stop = d[i1];
        var prestep;
        var step;
        var maxIter = 10;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }
        
        while (maxIter-- > 0) {
          step = tickIncrement(start, stop, count);
          if (step === prestep) {
            d[i0] = start;
            d[i1] = stop;
            return domain(d);
          } else if (step > 0) {
            start = Math.floor(start / step) * step;
            stop = Math.ceil(stop / step) * step;
          } else if (step < 0) {
            start = Math.ceil(start * step) / step;
            stop = Math.floor(stop * step) / step;
          } else {
            break;
          }
          prestep = step;
        }

        return scale;
      };

      return scale;
    }

    function linear() {
      var scale = continuous();

      scale.copy = function() {
        return copy$1(scale, linear());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    function transformer$1() {
      var x0 = 0,
          x1 = 1,
          t0,
          t1,
          k10,
          transform,
          interpolator = identity$1,
          clamp = false,
          unknown;

      function scale(x) {
        return x == null || isNaN(x = +x) ? unknown : interpolator(k10 === 0 ? 0.5 : (x = (transform(x) - t0) * k10, clamp ? Math.max(0, Math.min(1, x)) : x));
      }

      scale.domain = function(_) {
        return arguments.length ? ([x0, x1] = _, t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0), scale) : [x0, x1];
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = !!_, scale) : clamp;
      };

      scale.interpolator = function(_) {
        return arguments.length ? (interpolator = _, scale) : interpolator;
      };

      function range(interpolate) {
        return function(_) {
          var r0, r1;
          return arguments.length ? ([r0, r1] = _, interpolator = interpolate(r0, r1), scale) : [interpolator(0), interpolator(1)];
        };
      }

      scale.range = range(interpolate$1);

      scale.rangeRound = range(interpolateRound);

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t) {
        transform = t, t0 = t(x0), t1 = t(x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0);
        return scale;
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .interpolator(source.interpolator())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function sequential() {
      var scale = linearish(transformer$1()(identity$1));

      scale.copy = function() {
        return copy(scale, sequential());
      };

      return initInterpolator.apply(scale, arguments);
    }

    function transformer() {
      var x0 = 0,
          x1 = 0.5,
          x2 = 1,
          s = 1,
          t0,
          t1,
          t2,
          k10,
          k21,
          interpolator = identity$1,
          transform,
          clamp = false,
          unknown;

      function scale(x) {
        return isNaN(x = +x) ? unknown : (x = 0.5 + ((x = +transform(x)) - t1) * (s * x < s * t1 ? k10 : k21), interpolator(clamp ? Math.max(0, Math.min(1, x)) : x));
      }

      scale.domain = function(_) {
        return arguments.length ? ([x0, x1, x2] = _, t0 = transform(x0 = +x0), t1 = transform(x1 = +x1), t2 = transform(x2 = +x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1, scale) : [x0, x1, x2];
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = !!_, scale) : clamp;
      };

      scale.interpolator = function(_) {
        return arguments.length ? (interpolator = _, scale) : interpolator;
      };

      function range(interpolate) {
        return function(_) {
          var r0, r1, r2;
          return arguments.length ? ([r0, r1, r2] = _, interpolator = piecewise(interpolate, [r0, r1, r2]), scale) : [interpolator(0), interpolator(0.5), interpolator(1)];
        };
      }

      scale.range = range(interpolate$1);

      scale.rangeRound = range(interpolateRound);

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t) {
        transform = t, t0 = t(x0), t1 = t(x1), t2 = t(x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), s = t1 < t0 ? -1 : 1;
        return scale;
      };
    }

    function diverging() {
      var scale = linearish(transformer()(identity$1));

      scale.copy = function() {
        return copy(scale, diverging());
      };

      return initInterpolator.apply(scale, arguments);
    }

    const colorScale_edges = diverging().interpolator(interpolateRdBu);
    const colorScale_clusters = ordinal().domain([...Array(get_store_value(maxDepth)).keys()]).unknown("grey").range(schemeTableau10);

    /* src\_components\Dendogram.svelte generated by Svelte v3.49.0 */

    const { console: console_1$2 } = globals;
    const file$3 = "src\\_components\\Dendogram.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (33:8) {#each data.links as link}
    function create_each_block$2(ctx) {
    	let path;
    	let path_d_value;
    	let path_stroke_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = pathGenerator(/*link*/ ctx[10], /*xScale*/ ctx[5], /*yScale*/ ctx[6], /*$transformX*/ ctx[3], /*$transformK*/ ctx[2]));
    			attr_dev(path, "fill", "none");
    			attr_dev(path, "stroke", path_stroke_value = /*c_value*/ ctx[7](/*link*/ ctx[10].source));
    			add_location(path, file$3, 33, 12, 1241);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, $transformX, $transformK*/ 13 && path_d_value !== (path_d_value = pathGenerator(/*link*/ ctx[10], /*xScale*/ ctx[5], /*yScale*/ ctx[6], /*$transformX*/ ctx[3], /*$transformK*/ ctx[2]))) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*data*/ 1 && path_stroke_value !== (path_stroke_value = /*c_value*/ ctx[7](/*link*/ ctx[10].source))) {
    				attr_dev(path, "stroke", path_stroke_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(33:8) {#each data.links as link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let svg;
    	let g;
    	let line;
    	let line_y__value;
    	let line_y__value_1;
    	let g_transform_value;
    	let each_value = /*data*/ ctx[0].links;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			line = svg_element("line");
    			attr_dev(line, "x1", 0);
    			attr_dev(line, "x2", width$2);
    			attr_dev(line, "y1", line_y__value = /*yScale*/ ctx[6](/*$threshold_clust*/ ctx[4]));
    			attr_dev(line, "y2", line_y__value_1 = /*yScale*/ ctx[6](/*$threshold_clust*/ ctx[4]));
    			attr_dev(line, "class", "line-threshold svelte-1bxkga8");
    			add_location(line, file$3, 38, 8, 1432);
    			attr_dev(g, "transform", g_transform_value = `translate(${/*bandwidth*/ ctx[1] * /*$transformK*/ ctx[2] / 2}, ${0})`);
    			add_location(g, file$3, 31, 4, 1130);
    			attr_dev(svg, "viewBox", `0 0 ${width$2} ${height$2}`);
    			add_location(svg, file$3, 30, 0, 1085);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append_dev(g, line);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pathGenerator, data, xScale, yScale, $transformX, $transformK, c_value*/ 237) {
    				each_value = /*data*/ ctx[0].links;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, line);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$threshold_clust*/ 16 && line_y__value !== (line_y__value = /*yScale*/ ctx[6](/*$threshold_clust*/ ctx[4]))) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*$threshold_clust*/ 16 && line_y__value_1 !== (line_y__value_1 = /*yScale*/ ctx[6](/*$threshold_clust*/ ctx[4]))) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*bandwidth, $transformK*/ 6 && g_transform_value !== (g_transform_value = `translate(${/*bandwidth*/ ctx[1] * /*$transformK*/ ctx[2] / 2}, ${0})`)) {
    				attr_dev(g, "transform", g_transform_value);
    			}
    		},
    		i: noop$2,
    		o: noop$2,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const width$2 = 500;
    const height$2 = 200;

    function instance$3($$self, $$props, $$invalidate) {
    	let $maxDepth;
    	let $transformK;
    	let $transformX;
    	let $threshold_clust;
    	validate_store(maxDepth, 'maxDepth');
    	component_subscribe($$self, maxDepth, $$value => $$invalidate(9, $maxDepth = $$value));
    	validate_store(transformK, 'transformK');
    	component_subscribe($$self, transformK, $$value => $$invalidate(2, $transformK = $$value));
    	validate_store(transformX, 'transformX');
    	component_subscribe($$self, transformX, $$value => $$invalidate(3, $transformX = $$value));
    	validate_store(threshold_clust, 'threshold_clust');
    	component_subscribe($$self, threshold_clust, $$value => $$invalidate(4, $threshold_clust = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dendogram', slots, []);
    	let { data = [] } = $$props;
    	let { n } = $$props;
    	let { bandwidth = 0 } = $$props;
    	const xScale = linear().domain([0, n]).range([0, width$2]);
    	const yScale = linear().range([0, height$2]).nice();

    	const c_value = source => {
    		const cluster_set = new Set(source.index.map(i => data.clusters[i]));

    		return cluster_set.size > 1
    		? "grey"
    		: colorScale_clusters([...cluster_set.values()][0]);
    	};

    	const writable_props = ['data', 'n', 'bandwidth'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Dendogram> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('n' in $$props) $$invalidate(8, n = $$props.n);
    		if ('bandwidth' in $$props) $$invalidate(1, bandwidth = $$props.bandwidth);
    	};

    	$$self.$capture_state = () => ({
    		max: max$1,
    		scaleLinear: linear,
    		threshold_clust,
    		maxDepth,
    		transformX,
    		transformK,
    		pathGenerator,
    		colorScale_clusters,
    		data,
    		n,
    		bandwidth,
    		width: width$2,
    		height: height$2,
    		xScale,
    		yScale,
    		c_value,
    		$maxDepth,
    		$transformK,
    		$transformX,
    		$threshold_clust
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('n' in $$props) $$invalidate(8, n = $$props.n);
    		if ('bandwidth' in $$props) $$invalidate(1, bandwidth = $$props.bandwidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			console.log(data.nodes);
    		}

    		if ($$self.$$.dirty & /*data*/ 1) {
    			yScale.domain([max$1(data.nodes, node => node["depth"]), 0]);
    		}

    		if ($$self.$$.dirty & /*$maxDepth*/ 512) {
    			colorScale_clusters.domain([...Array($maxDepth).keys()]).unknown("grey");
    		}
    	};

    	return [
    		data,
    		bandwidth,
    		$transformK,
    		$transformX,
    		$threshold_clust,
    		xScale,
    		yScale,
    		c_value,
    		n,
    		$maxDepth
    	];
    }

    class Dendogram extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, n: 8, bandwidth: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dendogram",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*n*/ ctx[8] === undefined && !('n' in props)) {
    			console_1$2.warn("<Dendogram> was created without expected prop 'n'");
    		}
    	}

    	get data() {
    		throw new Error("<Dendogram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Dendogram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get n() {
    		throw new Error("<Dendogram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set n(value) {
    		throw new Error("<Dendogram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bandwidth() {
    		throw new Error("<Dendogram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bandwidth(value) {
    		throw new Error("<Dendogram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\_components\Heatmap.svelte generated by Svelte v3.49.0 */

    const { console: console_1$1 } = globals;

    const file$2 = "src\\_components\\Heatmap.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (75:0) {#if $linkage !== "none"}
    function create_if_block$1(ctx) {
    	let div;
    	let dendogram_1;
    	let current;

    	dendogram_1 = new Dendogram({
    			props: {
    				data: /*h_clustering*/ ctx[2],
    				n: /*nodes*/ ctx[1].length,
    				bandwidth: /*bandWidth*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(dendogram_1.$$.fragment);
    			add_location(div, file$2, 75, 4, 2981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(dendogram_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dendogram_1_changes = {};
    			if (dirty & /*h_clustering*/ 4) dendogram_1_changes.data = /*h_clustering*/ ctx[2];
    			if (dirty & /*nodes*/ 2) dendogram_1_changes.n = /*nodes*/ ctx[1].length;
    			dendogram_1.$set(dendogram_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dendogram_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dendogram_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(dendogram_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(75:0) {#if $linkage !== \\\"none\\\"}",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#each links as cell}
    function create_each_block$1(ctx) {
    	let rect;
    	let title;
    	let t_value = `source: ${/*cell*/ ctx[18].source} - target: ${/*cell*/ ctx[18].target}` + "";
    	let t;
    	let rect_x_value;
    	let rect_y_value;
    	let rect_fill_value;
    	let rect_source_value;
    	let rect_target_value;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			title = svg_element("title");
    			t = text(t_value);
    			add_location(title, file$2, 91, 20, 3667);
    			attr_dev(rect, "x", rect_x_value = /*colScale*/ ctx[7](/*cell*/ ctx[18].target));
    			attr_dev(rect, "y", rect_y_value = /*rowScale*/ ctx[6](/*cell*/ ctx[18].source));
    			attr_dev(rect, "width", /*colScale*/ ctx[7].bandwidth() - .5);
    			attr_dev(rect, "height", /*rowScale*/ ctx[6].bandwidth() - .5);

    			attr_dev(rect, "fill", rect_fill_value = /*cell*/ ctx[18].value
    			? colorScale_edges(/*cell*/ ctx[18].value)
    			: "black");

    			attr_dev(rect, "class", "matrix-cell");
    			attr_dev(rect, "source", rect_source_value = /*cell*/ ctx[18].source);
    			attr_dev(rect, "target", rect_target_value = /*cell*/ ctx[18].target);
    			add_location(rect, file$2, 83, 16, 3259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    			append_dev(rect, title);
    			append_dev(title, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*links*/ 1 && t_value !== (t_value = `source: ${/*cell*/ ctx[18].source} - target: ${/*cell*/ ctx[18].target}` + "")) set_data_dev(t, t_value);

    			if (dirty & /*links*/ 1 && rect_x_value !== (rect_x_value = /*colScale*/ ctx[7](/*cell*/ ctx[18].target))) {
    				attr_dev(rect, "x", rect_x_value);
    			}

    			if (dirty & /*links*/ 1 && rect_y_value !== (rect_y_value = /*rowScale*/ ctx[6](/*cell*/ ctx[18].source))) {
    				attr_dev(rect, "y", rect_y_value);
    			}

    			if (dirty & /*links*/ 1 && rect_fill_value !== (rect_fill_value = /*cell*/ ctx[18].value
    			? colorScale_edges(/*cell*/ ctx[18].value)
    			: "black")) {
    				attr_dev(rect, "fill", rect_fill_value);
    			}

    			if (dirty & /*links*/ 1 && rect_source_value !== (rect_source_value = /*cell*/ ctx[18].source)) {
    				attr_dev(rect, "source", rect_source_value);
    			}

    			if (dirty & /*links*/ 1 && rect_target_value !== (rect_target_value = /*cell*/ ctx[18].target)) {
    				attr_dev(rect, "target", rect_target_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(83:12) {#each links as cell}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let div;
    	let svg_1;
    	let g;
    	let current;
    	let if_block = /*$linkage*/ ctx[3] !== "none" && create_if_block$1(ctx);
    	let each_value = /*links*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div = element("div");
    			svg_1 = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(g, file$2, 81, 8, 3183);
    			attr_dev(svg_1, "viewBox", `0 0 ${width$1} ${height$1}`);
    			add_location(svg_1, file$2, 80, 4, 3118);
    			attr_dev(div, "class", "mb-3");
    			add_location(div, file$2, 79, 0, 3095);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, svg_1);
    			append_dev(svg_1, g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			/*g_binding*/ ctx[13](g);
    			/*svg_1_binding*/ ctx[14](svg_1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$linkage*/ ctx[3] !== "none") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$linkage*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*colScale, links, rowScale, colorScale_edges*/ 193) {
    				each_value = /*links*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*g_binding*/ ctx[13](null);
    			/*svg_1_binding*/ ctx[14](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const width$1 = 500;
    const height$1 = 500;

    function instance$2($$self, $$props, $$invalidate) {
    	let $threshold_clust;
    	let $linkage;
    	let $domain_max;
    	let $domain_center;
    	let $domain_min;
    	let $_data_2;
    	validate_store(threshold_clust, 'threshold_clust');
    	component_subscribe($$self, threshold_clust, $$value => $$invalidate(9, $threshold_clust = $$value));
    	validate_store(linkage, 'linkage');
    	component_subscribe($$self, linkage, $$value => $$invalidate(3, $linkage = $$value));
    	validate_store(domain_max, 'domain_max');
    	component_subscribe($$self, domain_max, $$value => $$invalidate(10, $domain_max = $$value));
    	validate_store(domain_center, 'domain_center');
    	component_subscribe($$self, domain_center, $$value => $$invalidate(11, $domain_center = $$value));
    	validate_store(domain_min, 'domain_min');
    	component_subscribe($$self, domain_min, $$value => $$invalidate(12, $domain_min = $$value));
    	validate_store(_data_2, '_data_2');
    	component_subscribe($$self, _data_2, $$value => $$invalidate(15, $_data_2 = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Heatmap', slots, []);
    	let { nodes = [] } = $$props;
    	let { links = [] } = $$props;

    	// Matrix is just a regular dataframe, can be replaced with other input but check how it links to non matrix dat
    	let matrix = links2Matrix(nodes, links);

    	console.log(matrix);
    	let othermatrix = $_data_2;

    	// Scales
    	const rowScale = band().domain(nodes.map(d => d.label)).range([0, height$1]);

    	const colScale = band().domain(nodes.map(d => d.label)).range([0, width$1]);
    	const bandWidth = colScale.bandwidth();

    	// Clustering, the matrix is the actual data that is used for the hclust on line 37 (defined in 17)
    	// in orer for the order of the matrix to switch the imported node names need to be the same as the one from the other matrix
    	const h_clustering = { nodes: [], links: [], clusters: [] };

    	// Binds
    	let svg, g_heatmap;

    	onMount(() => {
    		select(svg).call(brushFunction(g_heatmap, () => !event.shiftKey));
    		select(svg).call(zoomFunction(width$1, height$1, () => event.shiftKey, true));
    	});

    	const writable_props = ['nodes', 'links'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Heatmap> was created with unknown prop '${key}'`);
    	});

    	function g_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			g_heatmap = $$value;
    			$$invalidate(5, g_heatmap);
    		});
    	}

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(4, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('nodes' in $$props) $$invalidate(1, nodes = $$props.nodes);
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    	};

    	$$self.$capture_state = () => ({
    		scaleBand: band,
    		select,
    		onMount,
    		Dendogram,
    		zoomFunction,
    		brushFunction,
    		links2Matrix,
    		hclust,
    		clusters,
    		dendogram,
    		colorScale_edges,
    		domain_min,
    		domain_center,
    		domain_max,
    		linkage,
    		threshold_clust,
    		_data_2,
    		nodes,
    		links,
    		matrix,
    		othermatrix,
    		width: width$1,
    		height: height$1,
    		rowScale,
    		colScale,
    		bandWidth,
    		h_clustering,
    		svg,
    		g_heatmap,
    		$threshold_clust,
    		$linkage,
    		$domain_max,
    		$domain_center,
    		$domain_min,
    		$_data_2
    	});

    	$$self.$inject_state = $$props => {
    		if ('nodes' in $$props) $$invalidate(1, nodes = $$props.nodes);
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    		if ('matrix' in $$props) matrix = $$props.matrix;
    		if ('othermatrix' in $$props) $$invalidate(17, othermatrix = $$props.othermatrix);
    		if ('svg' in $$props) $$invalidate(4, svg = $$props.svg);
    		if ('g_heatmap' in $$props) $$invalidate(5, g_heatmap = $$props.g_heatmap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$domain_min, $domain_center, $domain_max, links*/ 7169) {
    			{
    				colorScale_edges.domain([$domain_min, $domain_center, $domain_max]);
    				(((((((($$invalidate(0, links), $$invalidate(12, $domain_min)), $$invalidate(11, $domain_center)), $$invalidate(10, $domain_max)), $$invalidate(3, $linkage)), $$invalidate(17, othermatrix)), $$invalidate(2, h_clustering)), $$invalidate(9, $threshold_clust)), $$invalidate(1, nodes));
    			}
    		}

    		if ($$self.$$.dirty & /*$linkage, h_clustering, $threshold_clust, nodes, links*/ 527) {
    			{
    				if ($linkage !== 'none') {
    					let clustering = hclust(othermatrix, $linkage);
    					$$invalidate(2, h_clustering.nodes = clustering.root.descendants(), h_clustering);
    					$$invalidate(2, h_clustering.links = dendogram(h_clustering.nodes).links, h_clustering);
    					$$invalidate(2, h_clustering.clusters = clusters(clustering, $threshold_clust, nodes.length), h_clustering);
    					nodes.forEach((d, i) => d.cluster = h_clustering.clusters[i]);
    					let order = clustering.root.index;
    					nodes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    				} else {
    					nodes.sort((a, b) => a.id - b.id);
    				}

    				rowScale.domain(nodes.map(d => d.label));
    				colScale.domain(nodes.map(d => d.label));
    				(((((((($$invalidate(0, links), $$invalidate(12, $domain_min)), $$invalidate(11, $domain_center)), $$invalidate(10, $domain_max)), $$invalidate(3, $linkage)), $$invalidate(17, othermatrix)), $$invalidate(2, h_clustering)), $$invalidate(9, $threshold_clust)), $$invalidate(1, nodes));
    			}
    		}

    		if ($$self.$$.dirty & /*nodes*/ 2) {
    			// To compare the difference between h_clustering.nodes data and the normal nodes data
    			// $:console.log(h_clustering.nodes);
    			console.log(nodes);
    		}

    		if ($$self.$$.dirty & /*links*/ 1) {
    			// $:console.log(h_clustering.links);
    			console.log(links);
    		}

    		if ($$self.$$.dirty & /*h_clustering*/ 4) {
    			console.log(h_clustering);
    		}
    	};

    	console.log(othermatrix);

    	return [
    		links,
    		nodes,
    		h_clustering,
    		$linkage,
    		svg,
    		g_heatmap,
    		rowScale,
    		colScale,
    		bandWidth,
    		$threshold_clust,
    		$domain_max,
    		$domain_center,
    		$domain_min,
    		g_binding,
    		svg_1_binding
    	];
    }

    class Heatmap extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, { nodes: 1, links: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Heatmap",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get nodes() {
    		throw new Error("<Heatmap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodes(value) {
    		throw new Error("<Heatmap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get links() {
    		throw new Error("<Heatmap>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set links(value) {
    		throw new Error("<Heatmap>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function forceCenter(x, y) {
      var nodes, strength = 1;

      if (x == null) x = 0;
      if (y == null) y = 0;

      function force() {
        var i,
            n = nodes.length,
            node,
            sx = 0,
            sy = 0;

        for (i = 0; i < n; ++i) {
          node = nodes[i], sx += node.x, sy += node.y;
        }

        for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
          node = nodes[i], node.x -= sx, node.y -= sy;
        }
      }

      force.initialize = function(_) {
        nodes = _;
      };

      force.x = function(_) {
        return arguments.length ? (x = +_, force) : x;
      };

      force.y = function(_) {
        return arguments.length ? (y = +_, force) : y;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      return force;
    }

    function tree_add(d) {
      const x = +this._x.call(null, d),
          y = +this._y.call(null, d);
      return add(this.cover(x, y), x, y, d);
    }

    function add(tree, x, y, d) {
      if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

      var parent,
          node = tree._root,
          leaf = {data: d},
          x0 = tree._x0,
          y0 = tree._y0,
          x1 = tree._x1,
          y1 = tree._y1,
          xm,
          ym,
          xp,
          yp,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return tree._root = leaf, tree;

      // Find the existing leaf for the new point, or add it.
      while (node.length) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
      }

      // Is the new point is exactly coincident with the existing point?
      xp = +tree._x.call(null, node.data);
      yp = +tree._y.call(null, node.data);
      if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

      // Otherwise, split the leaf node until the old and new point are separated.
      do {
        parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
      return parent[j] = node, parent[i] = leaf, tree;
    }

    function addAll(data) {
      var d, i, n = data.length,
          x,
          y,
          xz = new Array(n),
          yz = new Array(n),
          x0 = Infinity,
          y0 = Infinity,
          x1 = -Infinity,
          y1 = -Infinity;

      // Compute the points and their extent.
      for (i = 0; i < n; ++i) {
        if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
        xz[i] = x;
        yz[i] = y;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }

      // If there were no (valid) points, abort.
      if (x0 > x1 || y0 > y1) return this;

      // Expand the tree to cover the new points.
      this.cover(x0, y0).cover(x1, y1);

      // Add the new points.
      for (i = 0; i < n; ++i) {
        add(this, xz[i], yz[i], data[i]);
      }

      return this;
    }

    function tree_cover(x, y) {
      if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

      var x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1;

      // If the quadtree has no extent, initialize them.
      // Integer extent are necessary so that if we later double the extent,
      // the existing quadrant boundaries don’t change due to floating point error!
      if (isNaN(x0)) {
        x1 = (x0 = Math.floor(x)) + 1;
        y1 = (y0 = Math.floor(y)) + 1;
      }

      // Otherwise, double repeatedly to cover.
      else {
        var z = x1 - x0 || 1,
            node = this._root,
            parent,
            i;

        while (x0 > x || x >= x1 || y0 > y || y >= y1) {
          i = (y < y0) << 1 | (x < x0);
          parent = new Array(4), parent[i] = node, node = parent, z *= 2;
          switch (i) {
            case 0: x1 = x0 + z, y1 = y0 + z; break;
            case 1: x0 = x1 - z, y1 = y0 + z; break;
            case 2: x1 = x0 + z, y0 = y1 - z; break;
            case 3: x0 = x1 - z, y0 = y1 - z; break;
          }
        }

        if (this._root && this._root.length) this._root = node;
      }

      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      return this;
    }

    function tree_data() {
      var data = [];
      this.visit(function(node) {
        if (!node.length) do data.push(node.data); while (node = node.next)
      });
      return data;
    }

    function tree_extent(_) {
      return arguments.length
          ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
          : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
    }

    function Quad(node, x0, y0, x1, y1) {
      this.node = node;
      this.x0 = x0;
      this.y0 = y0;
      this.x1 = x1;
      this.y1 = y1;
    }

    function tree_find(x, y, radius) {
      var data,
          x0 = this._x0,
          y0 = this._y0,
          x1,
          y1,
          x2,
          y2,
          x3 = this._x1,
          y3 = this._y1,
          quads = [],
          node = this._root,
          q,
          i;

      if (node) quads.push(new Quad(node, x0, y0, x3, y3));
      if (radius == null) radius = Infinity;
      else {
        x0 = x - radius, y0 = y - radius;
        x3 = x + radius, y3 = y + radius;
        radius *= radius;
      }

      while (q = quads.pop()) {

        // Stop searching if this quadrant can’t contain a closer node.
        if (!(node = q.node)
            || (x1 = q.x0) > x3
            || (y1 = q.y0) > y3
            || (x2 = q.x1) < x0
            || (y2 = q.y1) < y0) continue;

        // Bisect the current quadrant.
        if (node.length) {
          var xm = (x1 + x2) / 2,
              ym = (y1 + y2) / 2;

          quads.push(
            new Quad(node[3], xm, ym, x2, y2),
            new Quad(node[2], x1, ym, xm, y2),
            new Quad(node[1], xm, y1, x2, ym),
            new Quad(node[0], x1, y1, xm, ym)
          );

          // Visit the closest quadrant first.
          if (i = (y >= ym) << 1 | (x >= xm)) {
            q = quads[quads.length - 1];
            quads[quads.length - 1] = quads[quads.length - 1 - i];
            quads[quads.length - 1 - i] = q;
          }
        }

        // Visit this point. (Visiting coincident points isn’t necessary!)
        else {
          var dx = x - +this._x.call(null, node.data),
              dy = y - +this._y.call(null, node.data),
              d2 = dx * dx + dy * dy;
          if (d2 < radius) {
            var d = Math.sqrt(radius = d2);
            x0 = x - d, y0 = y - d;
            x3 = x + d, y3 = y + d;
            data = node.data;
          }
        }
      }

      return data;
    }

    function tree_remove(d) {
      if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

      var parent,
          node = this._root,
          retainer,
          previous,
          next,
          x0 = this._x0,
          y0 = this._y0,
          x1 = this._x1,
          y1 = this._y1,
          x,
          y,
          xm,
          ym,
          right,
          bottom,
          i,
          j;

      // If the tree is empty, initialize the root as a leaf.
      if (!node) return this;

      // Find the leaf node for the point.
      // While descending, also retain the deepest parent with a non-removed sibling.
      if (node.length) while (true) {
        if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
        if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
        if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
        if (!node.length) break;
        if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
      }

      // Find the point to remove.
      while (node.data !== d) if (!(previous = node, node = node.next)) return this;
      if (next = node.next) delete node.next;

      // If there are multiple coincident points, remove just the point.
      if (previous) return (next ? previous.next = next : delete previous.next), this;

      // If this is the root point, remove it.
      if (!parent) return this._root = next, this;

      // Remove this leaf.
      next ? parent[i] = next : delete parent[i];

      // If the parent now contains exactly one leaf, collapse superfluous parents.
      if ((node = parent[0] || parent[1] || parent[2] || parent[3])
          && node === (parent[3] || parent[2] || parent[1] || parent[0])
          && !node.length) {
        if (retainer) retainer[j] = node;
        else this._root = node;
      }

      return this;
    }

    function removeAll(data) {
      for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
      return this;
    }

    function tree_root() {
      return this._root;
    }

    function tree_size() {
      var size = 0;
      this.visit(function(node) {
        if (!node.length) do ++size; while (node = node.next)
      });
      return size;
    }

    function tree_visit(callback) {
      var quads = [], q, node = this._root, child, x0, y0, x1, y1;
      if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
          var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        }
      }
      return this;
    }

    function tree_visitAfter(callback) {
      var quads = [], next = [], q;
      if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
      while (q = quads.pop()) {
        var node = q.node;
        if (node.length) {
          var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
          if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
          if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
          if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
          if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        }
        next.push(q);
      }
      while (q = next.pop()) {
        callback(q.node, q.x0, q.y0, q.x1, q.y1);
      }
      return this;
    }

    function defaultX(d) {
      return d[0];
    }

    function tree_x(_) {
      return arguments.length ? (this._x = _, this) : this._x;
    }

    function defaultY(d) {
      return d[1];
    }

    function tree_y(_) {
      return arguments.length ? (this._y = _, this) : this._y;
    }

    function quadtree(nodes, x, y) {
      var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
      return nodes == null ? tree : tree.addAll(nodes);
    }

    function Quadtree(x, y, x0, y0, x1, y1) {
      this._x = x;
      this._y = y;
      this._x0 = x0;
      this._y0 = y0;
      this._x1 = x1;
      this._y1 = y1;
      this._root = undefined;
    }

    function leaf_copy(leaf) {
      var copy = {data: leaf.data}, next = copy;
      while (leaf = leaf.next) next = next.next = {data: leaf.data};
      return copy;
    }

    var treeProto = quadtree.prototype = Quadtree.prototype;

    treeProto.copy = function() {
      var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
          node = this._root,
          nodes,
          child;

      if (!node) return copy;

      if (!node.length) return copy._root = leaf_copy(node), copy;

      nodes = [{source: node, target: copy._root = new Array(4)}];
      while (node = nodes.pop()) {
        for (var i = 0; i < 4; ++i) {
          if (child = node.source[i]) {
            if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
            else node.target[i] = leaf_copy(child);
          }
        }
      }

      return copy;
    };

    treeProto.add = tree_add;
    treeProto.addAll = addAll;
    treeProto.cover = tree_cover;
    treeProto.data = tree_data;
    treeProto.extent = tree_extent;
    treeProto.find = tree_find;
    treeProto.remove = tree_remove;
    treeProto.removeAll = removeAll;
    treeProto.root = tree_root;
    treeProto.size = tree_size;
    treeProto.visit = tree_visit;
    treeProto.visitAfter = tree_visitAfter;
    treeProto.x = tree_x;
    treeProto.y = tree_y;

    function constant(x) {
      return function() {
        return x;
      };
    }

    function jiggle(random) {
      return (random() - 0.5) * 1e-6;
    }

    function x$1(d) {
      return d.x + d.vx;
    }

    function y$1(d) {
      return d.y + d.vy;
    }

    function forceCollide(radius) {
      var nodes,
          radii,
          random,
          strength = 1,
          iterations = 1;

      if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

      function force() {
        var i, n = nodes.length,
            tree,
            node,
            xi,
            yi,
            ri,
            ri2;

        for (var k = 0; k < iterations; ++k) {
          tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
          for (i = 0; i < n; ++i) {
            node = nodes[i];
            ri = radii[node.index], ri2 = ri * ri;
            xi = node.x + node.vx;
            yi = node.y + node.vy;
            tree.visit(apply);
          }
        }

        function apply(quad, x0, y0, x1, y1) {
          var data = quad.data, rj = quad.r, r = ri + rj;
          if (data) {
            if (data.index > node.index) {
              var x = xi - data.x - data.vx,
                  y = yi - data.y - data.vy,
                  l = x * x + y * y;
              if (l < r * r) {
                if (x === 0) x = jiggle(random), l += x * x;
                if (y === 0) y = jiggle(random), l += y * y;
                l = (r - (l = Math.sqrt(l))) / l * strength;
                node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                node.vy += (y *= l) * r;
                data.vx -= x * (r = 1 - r);
                data.vy -= y * r;
              }
            }
            return;
          }
          return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
        }
      }

      function prepare(quad) {
        if (quad.data) return quad.r = radii[quad.data.index];
        for (var i = quad.r = 0; i < 4; ++i) {
          if (quad[i] && quad[i].r > quad.r) {
            quad.r = quad[i].r;
          }
        }
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        radii = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
      };

      return force;
    }

    function index(d) {
      return d.index;
    }

    function find(nodeById, nodeId) {
      var node = nodeById.get(nodeId);
      if (!node) throw new Error("node not found: " + nodeId);
      return node;
    }

    function forceLink(links) {
      var id = index,
          strength = defaultStrength,
          strengths,
          distance = constant(30),
          distances,
          nodes,
          count,
          bias,
          random,
          iterations = 1;

      if (links == null) links = [];

      function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
      }

      function force(alpha) {
        for (var k = 0, n = links.length; k < iterations; ++k) {
          for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
            link = links[i], source = link.source, target = link.target;
            x = target.x + target.vx - source.x - source.vx || jiggle(random);
            y = target.y + target.vy - source.y - source.vy || jiggle(random);
            l = Math.sqrt(x * x + y * y);
            l = (l - distances[i]) / l * alpha * strengths[i];
            x *= l, y *= l;
            target.vx -= x * (b = bias[i]);
            target.vy -= y * b;
            source.vx += x * (b = 1 - b);
            source.vy += y * b;
          }
        }
      }

      function initialize() {
        if (!nodes) return;

        var i,
            n = nodes.length,
            m = links.length,
            nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
            link;

        for (i = 0, count = new Array(n); i < m; ++i) {
          link = links[i], link.index = i;
          if (typeof link.source !== "object") link.source = find(nodeById, link.source);
          if (typeof link.target !== "object") link.target = find(nodeById, link.target);
          count[link.source.index] = (count[link.source.index] || 0) + 1;
          count[link.target.index] = (count[link.target.index] || 0) + 1;
        }

        for (i = 0, bias = new Array(m); i < m; ++i) {
          link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }

        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
      }

      function initializeStrength() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          strengths[i] = +strength(links[i], i, links);
        }
      }

      function initializeDistance() {
        if (!nodes) return;

        for (var i = 0, n = links.length; i < n; ++i) {
          distances[i] = +distance(links[i], i, links);
        }
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
      };

      force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
      };

      force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
      };

      force.distance = function(_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
      };

      return force;
    }

    // https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296; // 2^32

    function lcg() {
      let s = 1;
      return () => (s = (a * s + c) % m) / m;
    }

    function x(d) {
      return d.x;
    }

    function y(d) {
      return d.y;
    }

    var initialRadius = 10,
        initialAngle = Math.PI * (3 - Math.sqrt(5));

    function forceSimulation(nodes) {
      var simulation,
          alpha = 1,
          alphaMin = 0.001,
          alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
          alphaTarget = 0,
          velocityDecay = 0.6,
          forces = new Map(),
          stepper = timer(step),
          event = dispatch("tick", "end"),
          random = lcg();

      if (nodes == null) nodes = [];

      function step() {
        tick();
        event.call("tick", simulation);
        if (alpha < alphaMin) {
          stepper.stop();
          event.call("end", simulation);
        }
      }

      function tick(iterations) {
        var i, n = nodes.length, node;

        if (iterations === undefined) iterations = 1;

        for (var k = 0; k < iterations; ++k) {
          alpha += (alphaTarget - alpha) * alphaDecay;

          forces.forEach(function(force) {
            force(alpha);
          });

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            if (node.fx == null) node.x += node.vx *= velocityDecay;
            else node.x = node.fx, node.vx = 0;
            if (node.fy == null) node.y += node.vy *= velocityDecay;
            else node.y = node.fy, node.vy = 0;
          }
        }

        return simulation;
      }

      function initializeNodes() {
        for (var i = 0, n = nodes.length, node; i < n; ++i) {
          node = nodes[i], node.index = i;
          if (node.fx != null) node.x = node.fx;
          if (node.fy != null) node.y = node.fy;
          if (isNaN(node.x) || isNaN(node.y)) {
            var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
          }
          if (isNaN(node.vx) || isNaN(node.vy)) {
            node.vx = node.vy = 0;
          }
        }
      }

      function initializeForce(force) {
        if (force.initialize) force.initialize(nodes, random);
        return force;
      }

      initializeNodes();

      return simulation = {
        tick: tick,

        restart: function() {
          return stepper.restart(step), simulation;
        },

        stop: function() {
          return stepper.stop(), simulation;
        },

        nodes: function(_) {
          return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
        },

        alpha: function(_) {
          return arguments.length ? (alpha = +_, simulation) : alpha;
        },

        alphaMin: function(_) {
          return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
        },

        alphaDecay: function(_) {
          return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
        },

        alphaTarget: function(_) {
          return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
        },

        velocityDecay: function(_) {
          return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
        },

        randomSource: function(_) {
          return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
        },

        force: function(name, _) {
          return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
        },

        find: function(x, y, radius) {
          var i = 0,
              n = nodes.length,
              dx,
              dy,
              d2,
              node,
              closest;

          if (radius == null) radius = Infinity;
          else radius *= radius;

          for (i = 0; i < n; ++i) {
            node = nodes[i];
            dx = x - node.x;
            dy = y - node.y;
            d2 = dx * dx + dy * dy;
            if (d2 < radius) closest = node, radius = d2;
          }

          return closest;
        },

        on: function(name, _) {
          return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
        }
      };
    }

    function forceManyBody() {
      var nodes,
          node,
          random,
          alpha,
          strength = constant(-30),
          strengths,
          distanceMin2 = 1,
          distanceMax2 = Infinity,
          theta2 = 0.81;

      function force(_) {
        var i, n = nodes.length, tree = quadtree(nodes, x, y).visitAfter(accumulate);
        for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
      }

      function initialize() {
        if (!nodes) return;
        var i, n = nodes.length, node;
        strengths = new Array(n);
        for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
      }

      function accumulate(quad) {
        var strength = 0, q, c, weight = 0, x, y, i;

        // For internal nodes, accumulate forces from child quadrants.
        if (quad.length) {
          for (x = y = i = 0; i < 4; ++i) {
            if ((q = quad[i]) && (c = Math.abs(q.value))) {
              strength += q.value, weight += c, x += c * q.x, y += c * q.y;
            }
          }
          quad.x = x / weight;
          quad.y = y / weight;
        }

        // For leaf nodes, accumulate forces from coincident quadrants.
        else {
          q = quad;
          q.x = q.data.x;
          q.y = q.data.y;
          do strength += strengths[q.data.index];
          while (q = q.next);
        }

        quad.value = strength;
      }

      function apply(quad, x1, _, x2) {
        if (!quad.value) return true;

        var x = quad.x - node.x,
            y = quad.y - node.y,
            w = x2 - x1,
            l = x * x + y * y;

        // Apply the Barnes-Hut approximation if possible.
        // Limit forces for very close nodes; randomize direction if coincident.
        if (w * w / theta2 < l) {
          if (l < distanceMax2) {
            if (x === 0) x = jiggle(random), l += x * x;
            if (y === 0) y = jiggle(random), l += y * y;
            if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
            node.vx += x * quad.value * alpha / l;
            node.vy += y * quad.value * alpha / l;
          }
          return true;
        }

        // Otherwise, process points directly.
        else if (quad.length || l >= distanceMax2) return;

        // Limit forces for very close nodes; randomize direction if coincident.
        if (quad.data !== node || quad.next) {
          if (x === 0) x = jiggle(random), l += x * x;
          if (y === 0) y = jiggle(random), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        }

        do if (quad.data !== node) {
          w = strengths[quad.data.index] * alpha / l;
          node.vx += x * w;
          node.vy += y * w;
        } while (quad = quad.next);
      }

      force.initialize = function(_nodes, _random) {
        nodes = _nodes;
        random = _random;
        initialize();
      };

      force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
      };

      force.distanceMin = function(_) {
        return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
      };

      force.distanceMax = function(_) {
        return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
      };

      force.theta = function(_) {
        return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
      };

      return force;
    }

    /* src\_components\Network.svelte generated by Svelte v3.49.0 */
    const file$1 = "src\\_components\\Network.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    // (98:12) {#each linksBrushed as link}
    function create_each_block_1(ctx) {
    	let line;
    	let title;
    	let t_value = `source: ${/*link*/ ctx[26].source.label} - target: ${/*link*/ ctx[26].target.label}: value: ${/*link*/ ctx[26].value}` + "";
    	let t;
    	let line_x__value;
    	let line_y__value;
    	let line_x__value_1;
    	let line_y__value_1;
    	let line_stroke_value;
    	let line_opacity_value;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			title = svg_element("title");
    			t = text(t_value);
    			add_location(title, file$1, 106, 20, 3873);
    			attr_dev(line, "class", "link");
    			attr_dev(line, "x1", line_x__value = /*link*/ ctx[26].source.x);
    			attr_dev(line, "y1", line_y__value = /*link*/ ctx[26].source.y);
    			attr_dev(line, "x2", line_x__value_1 = /*link*/ ctx[26].target.x);
    			attr_dev(line, "y2", line_y__value_1 = /*link*/ ctx[26].target.y);

    			attr_dev(line, "stroke", line_stroke_value = /*$color_method_edges*/ ctx[5] === "fixed"
    			? "black"
    			: /*link*/ ctx[26].value
    				? colorScale_edges(/*link*/ ctx[26].value)
    				: "black");

    			attr_dev(line, "stroke-width", /*$edge_width*/ ctx[6]);

    			attr_dev(line, "opacity", line_opacity_value = /*$toHighlight*/ ctx[7].includes(/*link*/ ctx[26].source.label) || /*$toHighlight*/ ctx[7].includes(/*link*/ ctx[26].target.label)
    			? 1
    			: /*$toHighlight*/ ctx[7].length > 1 ? .5 : 1);

    			add_location(line, file$1, 98, 16, 3345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    			append_dev(line, title);
    			append_dev(title, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*linksBrushed*/ 4 && t_value !== (t_value = `source: ${/*link*/ ctx[26].source.label} - target: ${/*link*/ ctx[26].target.label}: value: ${/*link*/ ctx[26].value}` + "")) set_data_dev(t, t_value);

    			if (dirty & /*linksBrushed*/ 4 && line_x__value !== (line_x__value = /*link*/ ctx[26].source.x)) {
    				attr_dev(line, "x1", line_x__value);
    			}

    			if (dirty & /*linksBrushed*/ 4 && line_y__value !== (line_y__value = /*link*/ ctx[26].source.y)) {
    				attr_dev(line, "y1", line_y__value);
    			}

    			if (dirty & /*linksBrushed*/ 4 && line_x__value_1 !== (line_x__value_1 = /*link*/ ctx[26].target.x)) {
    				attr_dev(line, "x2", line_x__value_1);
    			}

    			if (dirty & /*linksBrushed*/ 4 && line_y__value_1 !== (line_y__value_1 = /*link*/ ctx[26].target.y)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}

    			if (dirty & /*$color_method_edges, linksBrushed*/ 36 && line_stroke_value !== (line_stroke_value = /*$color_method_edges*/ ctx[5] === "fixed"
    			? "black"
    			: /*link*/ ctx[26].value
    				? colorScale_edges(/*link*/ ctx[26].value)
    				: "black")) {
    				attr_dev(line, "stroke", line_stroke_value);
    			}

    			if (dirty & /*$edge_width*/ 64) {
    				attr_dev(line, "stroke-width", /*$edge_width*/ ctx[6]);
    			}

    			if (dirty & /*$toHighlight, linksBrushed*/ 132 && line_opacity_value !== (line_opacity_value = /*$toHighlight*/ ctx[7].includes(/*link*/ ctx[26].source.label) || /*$toHighlight*/ ctx[7].includes(/*link*/ ctx[26].target.label)
    			? 1
    			: /*$toHighlight*/ ctx[7].length > 1 ? .5 : 1)) {
    				attr_dev(line, "opacity", line_opacity_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(98:12) {#each linksBrushed as link}",
    		ctx
    	});

    	return block;
    }

    // (112:12) {#each nodesBrushed as node}
    function create_each_block(ctx) {
    	let circle;
    	let title;
    	let t_value = toolTip(/*node*/ ctx[23]) + "";
    	let t;
    	let circle_cx_value;
    	let circle_cy_value;
    	let circle_fill_value;
    	let circle_opacity_value;
    	let addNodeListeners_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			title = svg_element("title");
    			t = text(t_value);
    			add_location(title, file$1, 122, 20, 4883);
    			attr_dev(circle, "class", "node svelte-17rcs8c");
    			attr_dev(circle, "cx", circle_cx_value = /*node*/ ctx[23].x);
    			attr_dev(circle, "cy", circle_cy_value = /*node*/ ctx[23].y);
    			attr_dev(circle, "r", /*$radius*/ ctx[8]);

    			attr_dev(circle, "fill", circle_fill_value = /*$color_method_nodes*/ ctx[3] === "fixed"
    			? "black"
    			: /*$color_method_nodes*/ ctx[3] === "clusters"
    				? colorScale_clusters(/*node*/ ctx[23].cluster)
    				: typeof /*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]] === "string"
    					? /*c_ordinal*/ ctx[9](/*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]])
    					: /*c_linear*/ ctx[10](/*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]]));

    			attr_dev(circle, "opacity", circle_opacity_value = /*$toHighlight*/ ctx[7].includes(/*node*/ ctx[23].label)
    			? 1
    			: /*$toHighlight*/ ctx[7].length > 0 ? 0.5 : 1);

    			add_location(circle, file$1, 113, 16, 4189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    			append_dev(circle, title);
    			append_dev(title, t);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(addNodeListeners_action = /*addNodeListeners*/ ctx[11].call(null, circle, /*node*/ ctx[23])),
    					listen_dev(
    						circle,
    						"mouseover",
    						function () {
    							if (is_function(highlight(/*links*/ ctx[0], /*node*/ ctx[23]))) highlight(/*links*/ ctx[0], /*node*/ ctx[23]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(circle, "mouseout", fade, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*nodesBrushed*/ 2 && t_value !== (t_value = toolTip(/*node*/ ctx[23]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*nodesBrushed*/ 2 && circle_cx_value !== (circle_cx_value = /*node*/ ctx[23].x)) {
    				attr_dev(circle, "cx", circle_cx_value);
    			}

    			if (dirty & /*nodesBrushed*/ 2 && circle_cy_value !== (circle_cy_value = /*node*/ ctx[23].y)) {
    				attr_dev(circle, "cy", circle_cy_value);
    			}

    			if (dirty & /*$radius*/ 256) {
    				attr_dev(circle, "r", /*$radius*/ ctx[8]);
    			}

    			if (dirty & /*$color_method_nodes, nodesBrushed*/ 10 && circle_fill_value !== (circle_fill_value = /*$color_method_nodes*/ ctx[3] === "fixed"
    			? "black"
    			: /*$color_method_nodes*/ ctx[3] === "clusters"
    				? colorScale_clusters(/*node*/ ctx[23].cluster)
    				: typeof /*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]] === "string"
    					? /*c_ordinal*/ ctx[9](/*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]])
    					: /*c_linear*/ ctx[10](/*node*/ ctx[23][/*$color_method_nodes*/ ctx[3]]))) {
    				attr_dev(circle, "fill", circle_fill_value);
    			}

    			if (dirty & /*$toHighlight, nodesBrushed*/ 130 && circle_opacity_value !== (circle_opacity_value = /*$toHighlight*/ ctx[7].includes(/*node*/ ctx[23].label)
    			? 1
    			: /*$toHighlight*/ ctx[7].length > 0 ? 0.5 : 1)) {
    				attr_dev(circle, "opacity", circle_opacity_value);
    			}

    			if (addNodeListeners_action && is_function(addNodeListeners_action.update) && dirty & /*nodesBrushed*/ 2) addNodeListeners_action.update.call(null, /*node*/ ctx[23]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(112:12) {#each nodesBrushed as node}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let svg_1;
    	let g2;
    	let g0;
    	let g1;
    	let each_value_1 = /*linksBrushed*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*nodesBrushed*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg_1 = svg_element("svg");
    			g2 = svg_element("g");
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			g1 = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g0, "class", "edges");
    			add_location(g0, file$1, 96, 8, 3270);
    			attr_dev(g1, "class", "nodes");
    			add_location(g1, file$1, 110, 8, 4041);
    			add_location(g2, file$1, 95, 4, 3258);
    			attr_dev(svg_1, "height", "100%");
    			attr_dev(svg_1, "viewBox", `0 0 ${width} ${height}`);
    			add_location(svg_1, file$1, 94, 0, 3183);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg_1, anchor);
    			append_dev(svg_1, g2);
    			append_dev(g2, g0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(g0, null);
    			}

    			append_dev(g2, g1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g1, null);
    			}

    			/*svg_1_binding*/ ctx[19](svg_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*linksBrushed, $color_method_edges, colorScale_edges, $edge_width, $toHighlight*/ 228) {
    				each_value_1 = /*linksBrushed*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(g0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*nodesBrushed, $radius, $color_method_nodes, colorScale_clusters, c_ordinal, c_linear, $toHighlight, highlight, links, fade, toolTip*/ 1931) {
    				each_value = /*nodesBrushed*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop$2,
    		o: noop$2,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg_1);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*svg_1_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const width = 500;
    const height = 500;

    function instance$1($$self, $$props, $$invalidate) {
    	let $simulationPause;
    	let $maxDepth;
    	let $color_method_nodes;
    	let $nodeFilter;
    	let $threshold_edges;
    	let $color_method_edges;
    	let $edge_width;
    	let $toHighlight;
    	let $radius;
    	validate_store(simulationPause, 'simulationPause');
    	component_subscribe($$self, simulationPause, $$value => $$invalidate(15, $simulationPause = $$value));
    	validate_store(maxDepth, 'maxDepth');
    	component_subscribe($$self, maxDepth, $$value => $$invalidate(16, $maxDepth = $$value));
    	validate_store(color_method_nodes, 'color_method_nodes');
    	component_subscribe($$self, color_method_nodes, $$value => $$invalidate(3, $color_method_nodes = $$value));
    	validate_store(nodeFilter, 'nodeFilter');
    	component_subscribe($$self, nodeFilter, $$value => $$invalidate(17, $nodeFilter = $$value));
    	validate_store(threshold_edges, 'threshold_edges');
    	component_subscribe($$self, threshold_edges, $$value => $$invalidate(18, $threshold_edges = $$value));
    	validate_store(color_method_edges, 'color_method_edges');
    	component_subscribe($$self, color_method_edges, $$value => $$invalidate(5, $color_method_edges = $$value));
    	validate_store(edge_width, 'edge_width');
    	component_subscribe($$self, edge_width, $$value => $$invalidate(6, $edge_width = $$value));
    	validate_store(toHighlight, 'toHighlight');
    	component_subscribe($$self, toHighlight, $$value => $$invalidate(7, $toHighlight = $$value));
    	validate_store(radius, 'radius');
    	component_subscribe($$self, radius, $$value => $$invalidate(8, $radius = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Network', slots, []);
    	let { nodes = [] } = $$props;
    	let { links = [] } = $$props;
    	let nodesBrushed = [];
    	let linksBrushed = [];
    	let links_filtered = [];

    	// Define scales
    	const c_ordinal = ordinal().range(schemeTableau10);

    	const c_linear = sequential().interpolator(interpolateBlues);
    	const c_diverging = diverging().interpolator(interpolateBrBG);

    	// Scales -- reactive domains
    	let values = [];

    	// Simulation Forces
    	const linkForce = forceLink().id(d => d.label);

    	const simulation = forceSimulation().alphaTarget(0.02).alphaDecay(0.001).force('link', linkForce).force('charge', forceManyBody()).force("collide", forceCollide()).force("center", forceCenter(width / 2, height / 2)).on('tick', () => {
    		((((($$invalidate(1, nodesBrushed), $$invalidate(17, $nodeFilter)), $$invalidate(12, nodes)), $$invalidate(13, links_filtered)), $$invalidate(0, links)), $$invalidate(18, $threshold_edges));
    		((((($$invalidate(2, linksBrushed), $$invalidate(17, $nodeFilter)), $$invalidate(12, nodes)), $$invalidate(13, links_filtered)), $$invalidate(0, links)), $$invalidate(18, $threshold_edges));
    	});

    	// Binds
    	let svg;

    	onMount(() => {
    		select(svg).call(zoomFunction(width, height, () => true, false));
    	});

    	function addNodeListeners(circle) {
    		return {
    			update(node) {
    				select(circle).call(dragFunction(node, simulation));
    			}
    		};
    	}

    	const writable_props = ['nodes', 'links'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Network> was created with unknown prop '${key}'`);
    	});

    	function svg_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			svg = $$value;
    			$$invalidate(4, svg);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('nodes' in $$props) $$invalidate(12, nodes = $$props.nodes);
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    	};

    	$$self.$capture_state = () => ({
    		forceSimulation,
    		forceLink,
    		forceManyBody,
    		forceCollide,
    		forceCenter,
    		min: min$1,
    		max: max$1,
    		extent,
    		scaleSequential: sequential,
    		scaleDiverging: diverging,
    		scaleOrdinal: ordinal,
    		interpolateBlues,
    		schemeTableau10,
    		interpolateBrBG,
    		select,
    		onMount,
    		threshold_edges,
    		simulationPause,
    		radius,
    		toHighlight,
    		nodeFilter,
    		edge_width,
    		maxDepth,
    		color_method_nodes,
    		color_method_edges,
    		zoomFunction,
    		dragFunction,
    		highlight,
    		fade,
    		toolTip,
    		colorScale_edges,
    		colorScale_clusters,
    		nodes,
    		links,
    		nodesBrushed,
    		linksBrushed,
    		links_filtered,
    		width,
    		height,
    		c_ordinal,
    		c_linear,
    		c_diverging,
    		values,
    		linkForce,
    		simulation,
    		svg,
    		addNodeListeners,
    		$simulationPause,
    		$maxDepth,
    		$color_method_nodes,
    		$nodeFilter,
    		$threshold_edges,
    		$color_method_edges,
    		$edge_width,
    		$toHighlight,
    		$radius
    	});

    	$$self.$inject_state = $$props => {
    		if ('nodes' in $$props) $$invalidate(12, nodes = $$props.nodes);
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    		if ('nodesBrushed' in $$props) $$invalidate(1, nodesBrushed = $$props.nodesBrushed);
    		if ('linksBrushed' in $$props) $$invalidate(2, linksBrushed = $$props.linksBrushed);
    		if ('links_filtered' in $$props) $$invalidate(13, links_filtered = $$props.links_filtered);
    		if ('values' in $$props) $$invalidate(14, values = $$props.values);
    		if ('svg' in $$props) $$invalidate(4, svg = $$props.svg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*links, $threshold_edges*/ 262145) {
    			$$invalidate(13, links_filtered = links[0].value
    			? links.filter(k => Math.abs(k.value) >= $threshold_edges)
    			: links);
    		}

    		if ($$self.$$.dirty & /*$nodeFilter, nodes, links_filtered*/ 143360) {
    			{
    				if ($nodeFilter.length > 0) {
    					$$invalidate(1, nodesBrushed = nodes.filter(d => $nodeFilter.includes(d.label)));
    					$$invalidate(2, linksBrushed = links_filtered.filter(d => $nodeFilter.includes(d.source.label) && $nodeFilter.includes(d.target.label)));
    				} else {
    					$$invalidate(1, nodesBrushed = nodes);
    					$$invalidate(2, linksBrushed = links_filtered);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$color_method_nodes, nodes, values*/ 20488) {
    			{
    				if (!($color_method_nodes === "fixed" || $color_method_nodes === "clusters")) {
    					$$invalidate(14, values = [...new Set(nodes.map(d => d[$color_method_nodes]))]);
    					c_ordinal.domain(values);
    					c_linear.domain(extent(values));
    					c_diverging.domain([min$1(values), 0, max$1(values)]);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$maxDepth*/ 65536) {
    			colorScale_clusters.domain([...Array($maxDepth).keys()]).unknown("grey");
    		}

    		if ($$self.$$.dirty & /*nodesBrushed, linksBrushed*/ 6) {
    			{
    				simulation.nodes(nodesBrushed);
    				linkForce.links(linksBrushed);
    			}
    		}

    		if ($$self.$$.dirty & /*$simulationPause*/ 32768) {
    			// Pause - Restart Simulation
    			{
    				$simulationPause
    				? simulation.stop()
    				: simulation.restart();
    			}
    		}
    	};

    	return [
    		links,
    		nodesBrushed,
    		linksBrushed,
    		$color_method_nodes,
    		svg,
    		$color_method_edges,
    		$edge_width,
    		$toHighlight,
    		$radius,
    		c_ordinal,
    		c_linear,
    		addNodeListeners,
    		nodes,
    		links_filtered,
    		values,
    		$simulationPause,
    		$maxDepth,
    		$nodeFilter,
    		$threshold_edges,
    		svg_1_binding
    	];
    }

    class Network extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, { nodes: 12, links: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Network",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get nodes() {
    		throw new Error("<Network>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nodes(value) {
    		throw new Error("<Network>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get links() {
    		throw new Error("<Network>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set links(value) {
    		throw new Error("<Network>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;

    const file = "src\\App.svelte";

    // (30:3) {#if $renderVisuals}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let h30;
    	let t1;
    	let heatmap;
    	let t2;
    	let div1;
    	let h31;
    	let t4;
    	let network;
    	let current;

    	heatmap = new Heatmap({
    			props: {
    				nodes: /*$nodes*/ ctx[0],
    				links: /*$links_heatmap*/ ctx[2]
    			},
    			$$inline: true
    		});

    	network = new Network({
    			props: {
    				nodes: /*$nodes*/ ctx[0],
    				links: /*$links_network*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Adjacency Matrix";
    			t1 = space();
    			create_component(heatmap.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Graph";
    			t4 = space();
    			create_component(network.$$.fragment);
    			attr_dev(h30, "class", "fs-4 mb-3");
    			add_location(h30, file, 32, 6, 1012);
    			attr_dev(div0, "class", "col-xl-6");
    			add_location(div0, file, 31, 5, 983);
    			attr_dev(h31, "class", "fs-4 mb-3");
    			add_location(h31, file, 36, 6, 1166);
    			attr_dev(div1, "class", "col-xl-6");
    			add_location(div1, file, 35, 5, 1137);
    			attr_dev(div2, "class", "row my-5");
    			add_location(div2, file, 30, 4, 955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t1);
    			mount_component(heatmap, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t4);
    			mount_component(network, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const heatmap_changes = {};
    			if (dirty & /*$nodes*/ 1) heatmap_changes.nodes = /*$nodes*/ ctx[0];
    			if (dirty & /*$links_heatmap*/ 4) heatmap_changes.links = /*$links_heatmap*/ ctx[2];
    			heatmap.$set(heatmap_changes);
    			const network_changes = {};
    			if (dirty & /*$nodes*/ 1) network_changes.nodes = /*$nodes*/ ctx[0];
    			if (dirty & /*$links_network*/ 8) network_changes.links = /*$links_network*/ ctx[3];
    			network.$set(network_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heatmap.$$.fragment, local);
    			transition_in(network.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heatmap.$$.fragment, local);
    			transition_out(network.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(heatmap);
    			destroy_component(network);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:3) {#if $renderVisuals}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let sidebar;
    	let t0;
    	let div1;
    	let navbar;
    	let t1;
    	let div0;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });
    	navbar = new Navbar({ $$inline: true });
    	let if_block = /*$renderVisuals*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "container-fluid px-4");
    			add_location(div0, file, 28, 2, 892);
    			attr_dev(div1, "id", "page-content-wrapper");
    			attr_dev(div1, "class", "svelte-7irkuf");
    			add_location(div1, file, 26, 1, 838);
    			attr_dev(div2, "class", "d-flex svelte-7irkuf");
    			attr_dev(div2, "id", "wrapper");
    			add_location(div2, file, 23, 0, 759);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			mount_component(sidebar, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			mount_component(navbar, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$renderVisuals*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$renderVisuals*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(sidebar);
    			destroy_component(navbar);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $_data_2;
    	let $nodes;
    	let $renderVisuals;
    	let $links_heatmap;
    	let $links_network;
    	validate_store(_data_2, '_data_2');
    	component_subscribe($$self, _data_2, $$value => $$invalidate(4, $_data_2 = $$value));
    	validate_store(nodes, 'nodes');
    	component_subscribe($$self, nodes, $$value => $$invalidate(0, $nodes = $$value));
    	validate_store(renderVisuals, 'renderVisuals');
    	component_subscribe($$self, renderVisuals, $$value => $$invalidate(1, $renderVisuals = $$value));
    	validate_store(links_heatmap, 'links_heatmap');
    	component_subscribe($$self, links_heatmap, $$value => $$invalidate(2, $links_heatmap = $$value));
    	validate_store(links_network, 'links_network');
    	component_subscribe($$self, links_network, $$value => $$invalidate(3, $links_network = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Navbar,
    		Heatmap,
    		Network,
    		nodes,
    		links_heatmap,
    		links_network,
    		renderVisuals,
    		_data_2,
    		myArray,
    		$_data_2,
    		$nodes,
    		$renderVisuals,
    		$links_heatmap,
    		$links_network
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$nodes*/ 1) {
    			console.log($nodes);
    		}

    		if ($$self.$$.dirty & /*$_data_2*/ 16) {
    			console.log($_data_2);
    		}

    		if ($$self.$$.dirty & /*$_data_2*/ 16) {
    			console.log(Array.isArray($_data_2));
    		}
    	};

    	return [$nodes, $renderVisuals, $links_heatmap, $links_network, $_data_2];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var top = 'top';
    var bottom = 'bottom';
    var right = 'right';
    var left = 'left';
    var auto = 'auto';
    var basePlacements = [top, bottom, right, left];
    var start = 'start';
    var end = 'end';
    var clippingParents = 'clippingParents';
    var viewport = 'viewport';
    var popper = 'popper';
    var reference = 'reference';
    var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
      return acc.concat([placement + "-" + start, placement + "-" + end]);
    }, []);
    var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
      return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
    }, []); // modifiers that need to read the DOM

    var beforeRead = 'beforeRead';
    var read = 'read';
    var afterRead = 'afterRead'; // pure-logic modifiers

    var beforeMain = 'beforeMain';
    var main = 'main';
    var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

    var beforeWrite = 'beforeWrite';
    var write = 'write';
    var afterWrite = 'afterWrite';
    var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

    function getNodeName(element) {
      return element ? (element.nodeName || '').toLowerCase() : null;
    }

    function getWindow(node) {
      if (node == null) {
        return window;
      }

      if (node.toString() !== '[object Window]') {
        var ownerDocument = node.ownerDocument;
        return ownerDocument ? ownerDocument.defaultView || window : window;
      }

      return node;
    }

    function isElement$1(node) {
      var OwnElement = getWindow(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    }

    function isHTMLElement(node) {
      var OwnElement = getWindow(node).HTMLElement;
      return node instanceof OwnElement || node instanceof HTMLElement;
    }

    function isShadowRoot(node) {
      // IE 11 has no ShadowRoot
      if (typeof ShadowRoot === 'undefined') {
        return false;
      }

      var OwnElement = getWindow(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }

    // and applies them to the HTMLElements such as popper and arrow

    function applyStyles(_ref) {
      var state = _ref.state;
      Object.keys(state.elements).forEach(function (name) {
        var style = state.styles[name] || {};
        var attributes = state.attributes[name] || {};
        var element = state.elements[name]; // arrow is optional + virtual elements

        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        } // Flow doesn't support to extend this property, but it's the most
        // effective way to apply styles to an HTMLElement
        // $FlowFixMe[cannot-write]


        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (name) {
          var value = attributes[name];

          if (value === false) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value === true ? '' : value);
          }
        });
      });
    }

    function effect$2(_ref2) {
      var state = _ref2.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: '0',
          top: '0',
          margin: '0'
        },
        arrow: {
          position: 'absolute'
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;

      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      }

      return function () {
        Object.keys(state.elements).forEach(function (name) {
          var element = state.elements[name];
          var attributes = state.attributes[name] || {};
          var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

          var style = styleProperties.reduce(function (style, property) {
            style[property] = '';
            return style;
          }, {}); // arrow is optional + virtual elements

          if (!isHTMLElement(element) || !getNodeName(element)) {
            return;
          }

          Object.assign(element.style, style);
          Object.keys(attributes).forEach(function (attribute) {
            element.removeAttribute(attribute);
          });
        });
      };
    } // eslint-disable-next-line import/no-unused-modules


    var applyStyles$1 = {
      name: 'applyStyles',
      enabled: true,
      phase: 'write',
      fn: applyStyles,
      effect: effect$2,
      requires: ['computeStyles']
    };

    function getBasePlacement(placement) {
      return placement.split('-')[0];
    }

    var max = Math.max;
    var min = Math.min;
    var round = Math.round;

    function getBoundingClientRect(element, includeScale) {
      if (includeScale === void 0) {
        includeScale = false;
      }

      var rect = element.getBoundingClientRect();
      var scaleX = 1;
      var scaleY = 1;

      if (isHTMLElement(element) && includeScale) {
        var offsetHeight = element.offsetHeight;
        var offsetWidth = element.offsetWidth; // Do not attempt to divide by 0, otherwise we get `Infinity` as scale
        // Fallback to 1 in case both values are `0`

        if (offsetWidth > 0) {
          scaleX = round(rect.width) / offsetWidth || 1;
        }

        if (offsetHeight > 0) {
          scaleY = round(rect.height) / offsetHeight || 1;
        }
      }

      return {
        width: rect.width / scaleX,
        height: rect.height / scaleY,
        top: rect.top / scaleY,
        right: rect.right / scaleX,
        bottom: rect.bottom / scaleY,
        left: rect.left / scaleX,
        x: rect.left / scaleX,
        y: rect.top / scaleY
      };
    }

    // means it doesn't take into account transforms.

    function getLayoutRect(element) {
      var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
      // Fixes https://github.com/popperjs/popper-core/issues/1223

      var width = element.offsetWidth;
      var height = element.offsetHeight;

      if (Math.abs(clientRect.width - width) <= 1) {
        width = clientRect.width;
      }

      if (Math.abs(clientRect.height - height) <= 1) {
        height = clientRect.height;
      }

      return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: width,
        height: height
      };
    }

    function contains(parent, child) {
      var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

      if (parent.contains(child)) {
        return true;
      } // then fallback to custom implementation with Shadow DOM support
      else if (rootNode && isShadowRoot(rootNode)) {
          var next = child;

          do {
            if (next && parent.isSameNode(next)) {
              return true;
            } // $FlowFixMe[prop-missing]: need a better way to handle this...


            next = next.parentNode || next.host;
          } while (next);
        } // Give up, the result is false


      return false;
    }

    function getComputedStyle$1(element) {
      return getWindow(element).getComputedStyle(element);
    }

    function isTableElement(element) {
      return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
    }

    function getDocumentElement(element) {
      // $FlowFixMe[incompatible-return]: assume body is always available
      return ((isElement$1(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
      element.document) || window.document).documentElement;
    }

    function getParentNode(element) {
      if (getNodeName(element) === 'html') {
        return element;
      }

      return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
        // $FlowFixMe[incompatible-return]
        // $FlowFixMe[prop-missing]
        element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
        element.parentNode || ( // DOM Element detected
        isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
        // $FlowFixMe[incompatible-call]: HTMLElement is a Node
        getDocumentElement(element) // fallback

      );
    }

    function getTrueOffsetParent(element) {
      if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
      getComputedStyle$1(element).position === 'fixed') {
        return null;
      }

      return element.offsetParent;
    } // `.offsetParent` reports `null` for fixed elements, while absolute elements
    // return the containing block


    function getContainingBlock(element) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
      var isIE = navigator.userAgent.indexOf('Trident') !== -1;

      if (isIE && isHTMLElement(element)) {
        // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
        var elementCss = getComputedStyle$1(element);

        if (elementCss.position === 'fixed') {
          return null;
        }
      }

      var currentNode = getParentNode(element);

      while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
        var css = getComputedStyle$1(currentNode); // This is non-exhaustive but covers the most common CSS properties that
        // create a containing block.
        // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

        if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
          return currentNode;
        } else {
          currentNode = currentNode.parentNode;
        }
      }

      return null;
    } // Gets the closest ancestor positioned element. Handles some edge cases,
    // such as table ancestors and cross browser bugs.


    function getOffsetParent(element) {
      var window = getWindow(element);
      var offsetParent = getTrueOffsetParent(element);

      while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
        offsetParent = getTrueOffsetParent(offsetParent);
      }

      if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static')) {
        return window;
      }

      return offsetParent || getContainingBlock(element) || window;
    }

    function getMainAxisFromPlacement(placement) {
      return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
    }

    function within(min$1, value, max$1) {
      return max(min$1, min(value, max$1));
    }
    function withinMaxClamp(min, value, max) {
      var v = within(min, value, max);
      return v > max ? max : v;
    }

    function getFreshSideObject() {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }

    function mergePaddingObject(paddingObject) {
      return Object.assign({}, getFreshSideObject(), paddingObject);
    }

    function expandToHashMap(value, keys) {
      return keys.reduce(function (hashMap, key) {
        hashMap[key] = value;
        return hashMap;
      }, {});
    }

    var toPaddingObject = function toPaddingObject(padding, state) {
      padding = typeof padding === 'function' ? padding(Object.assign({}, state.rects, {
        placement: state.placement
      })) : padding;
      return mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
    };

    function arrow(_ref) {
      var _state$modifiersData$;

      var state = _ref.state,
          name = _ref.name,
          options = _ref.options;
      var arrowElement = state.elements.arrow;
      var popperOffsets = state.modifiersData.popperOffsets;
      var basePlacement = getBasePlacement(state.placement);
      var axis = getMainAxisFromPlacement(basePlacement);
      var isVertical = [left, right].indexOf(basePlacement) >= 0;
      var len = isVertical ? 'height' : 'width';

      if (!arrowElement || !popperOffsets) {
        return;
      }

      var paddingObject = toPaddingObject(options.padding, state);
      var arrowRect = getLayoutRect(arrowElement);
      var minProp = axis === 'y' ? top : left;
      var maxProp = axis === 'y' ? bottom : right;
      var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
      var startDiff = popperOffsets[axis] - state.rects.reference[axis];
      var arrowOffsetParent = getOffsetParent(arrowElement);
      var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
      var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
      // outside of the popper bounds

      var min = paddingObject[minProp];
      var max = clientSize - arrowRect[len] - paddingObject[maxProp];
      var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
      var offset = within(min, center, max); // Prevents breaking syntax highlighting...

      var axisProp = axis;
      state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
    }

    function effect$1(_ref2) {
      var state = _ref2.state,
          options = _ref2.options;
      var _options$element = options.element,
          arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element;

      if (arrowElement == null) {
        return;
      } // CSS selector


      if (typeof arrowElement === 'string') {
        arrowElement = state.elements.popper.querySelector(arrowElement);

        if (!arrowElement) {
          return;
        }
      }

      if (process.env.NODE_ENV !== "production") {
        if (!isHTMLElement(arrowElement)) {
          console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', 'To use an SVG arrow, wrap it in an HTMLElement that will be used as', 'the arrow.'].join(' '));
        }
      }

      if (!contains(state.elements.popper, arrowElement)) {
        if (process.env.NODE_ENV !== "production") {
          console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', 'element.'].join(' '));
        }

        return;
      }

      state.elements.arrow = arrowElement;
    } // eslint-disable-next-line import/no-unused-modules


    var arrow$1 = {
      name: 'arrow',
      enabled: true,
      phase: 'main',
      fn: arrow,
      effect: effect$1,
      requires: ['popperOffsets'],
      requiresIfExists: ['preventOverflow']
    };

    function getVariation(placement) {
      return placement.split('-')[1];
    }

    var unsetSides = {
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto'
    }; // Round the offsets to the nearest suitable subpixel based on the DPR.
    // Zooming can change the DPR, but it seems to report a value that will
    // cleanly divide the values into the appropriate subpixels.

    function roundOffsetsByDPR(_ref) {
      var x = _ref.x,
          y = _ref.y;
      var win = window;
      var dpr = win.devicePixelRatio || 1;
      return {
        x: round(x * dpr) / dpr || 0,
        y: round(y * dpr) / dpr || 0
      };
    }

    function mapToStyles(_ref2) {
      var _Object$assign2;

      var popper = _ref2.popper,
          popperRect = _ref2.popperRect,
          placement = _ref2.placement,
          variation = _ref2.variation,
          offsets = _ref2.offsets,
          position = _ref2.position,
          gpuAcceleration = _ref2.gpuAcceleration,
          adaptive = _ref2.adaptive,
          roundOffsets = _ref2.roundOffsets,
          isFixed = _ref2.isFixed;
      var _offsets$x = offsets.x,
          x = _offsets$x === void 0 ? 0 : _offsets$x,
          _offsets$y = offsets.y,
          y = _offsets$y === void 0 ? 0 : _offsets$y;

      var _ref3 = typeof roundOffsets === 'function' ? roundOffsets({
        x: x,
        y: y
      }) : {
        x: x,
        y: y
      };

      x = _ref3.x;
      y = _ref3.y;
      var hasX = offsets.hasOwnProperty('x');
      var hasY = offsets.hasOwnProperty('y');
      var sideX = left;
      var sideY = top;
      var win = window;

      if (adaptive) {
        var offsetParent = getOffsetParent(popper);
        var heightProp = 'clientHeight';
        var widthProp = 'clientWidth';

        if (offsetParent === getWindow(popper)) {
          offsetParent = getDocumentElement(popper);

          if (getComputedStyle$1(offsetParent).position !== 'static' && position === 'absolute') {
            heightProp = 'scrollHeight';
            widthProp = 'scrollWidth';
          }
        } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


        offsetParent = offsetParent;

        if (placement === top || (placement === left || placement === right) && variation === end) {
          sideY = bottom;
          var offsetY = isFixed && win.visualViewport ? win.visualViewport.height : // $FlowFixMe[prop-missing]
          offsetParent[heightProp];
          y -= offsetY - popperRect.height;
          y *= gpuAcceleration ? 1 : -1;
        }

        if (placement === left || (placement === top || placement === bottom) && variation === end) {
          sideX = right;
          var offsetX = isFixed && win.visualViewport ? win.visualViewport.width : // $FlowFixMe[prop-missing]
          offsetParent[widthProp];
          x -= offsetX - popperRect.width;
          x *= gpuAcceleration ? 1 : -1;
        }
      }

      var commonStyles = Object.assign({
        position: position
      }, adaptive && unsetSides);

      var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
        x: x,
        y: y
      }) : {
        x: x,
        y: y
      };

      x = _ref4.x;
      y = _ref4.y;

      if (gpuAcceleration) {
        var _Object$assign;

        return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
      }

      return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
    }

    function computeStyles(_ref5) {
      var state = _ref5.state,
          options = _ref5.options;
      var _options$gpuAccelerat = options.gpuAcceleration,
          gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
          _options$adaptive = options.adaptive,
          adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
          _options$roundOffsets = options.roundOffsets,
          roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

      if (process.env.NODE_ENV !== "production") {
        var transitionProperty = getComputedStyle$1(state.elements.popper).transitionProperty || '';

        if (adaptive && ['transform', 'top', 'right', 'bottom', 'left'].some(function (property) {
          return transitionProperty.indexOf(property) >= 0;
        })) {
          console.warn(['Popper: Detected CSS transitions on at least one of the following', 'CSS properties: "transform", "top", "right", "bottom", "left".', '\n\n', 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', 'for smooth transitions, or remove these properties from the CSS', 'transition declaration on the popper element if only transitioning', 'opacity or background-color for example.', '\n\n', 'We recommend using the popper element as a wrapper around an inner', 'element that can have any CSS property transitioned for animations.'].join(' '));
        }
      }

      var commonStyles = {
        placement: getBasePlacement(state.placement),
        variation: getVariation(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration: gpuAcceleration,
        isFixed: state.options.strategy === 'fixed'
      };

      if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive: adaptive,
          roundOffsets: roundOffsets
        })));
      }

      if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: 'absolute',
          adaptive: false,
          roundOffsets: roundOffsets
        })));
      }

      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        'data-popper-placement': state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var computeStyles$1 = {
      name: 'computeStyles',
      enabled: true,
      phase: 'beforeWrite',
      fn: computeStyles,
      data: {}
    };

    var passive = {
      passive: true
    };

    function effect(_ref) {
      var state = _ref.state,
          instance = _ref.instance,
          options = _ref.options;
      var _options$scroll = options.scroll,
          scroll = _options$scroll === void 0 ? true : _options$scroll,
          _options$resize = options.resize,
          resize = _options$resize === void 0 ? true : _options$resize;
      var window = getWindow(state.elements.popper);
      var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.addEventListener('scroll', instance.update, passive);
        });
      }

      if (resize) {
        window.addEventListener('resize', instance.update, passive);
      }

      return function () {
        if (scroll) {
          scrollParents.forEach(function (scrollParent) {
            scrollParent.removeEventListener('scroll', instance.update, passive);
          });
        }

        if (resize) {
          window.removeEventListener('resize', instance.update, passive);
        }
      };
    } // eslint-disable-next-line import/no-unused-modules


    var eventListeners = {
      name: 'eventListeners',
      enabled: true,
      phase: 'write',
      fn: function fn() {},
      effect: effect,
      data: {}
    };

    var hash$1 = {
      left: 'right',
      right: 'left',
      bottom: 'top',
      top: 'bottom'
    };
    function getOppositePlacement(placement) {
      return placement.replace(/left|right|bottom|top/g, function (matched) {
        return hash$1[matched];
      });
    }

    var hash = {
      start: 'end',
      end: 'start'
    };
    function getOppositeVariationPlacement(placement) {
      return placement.replace(/start|end/g, function (matched) {
        return hash[matched];
      });
    }

    function getWindowScroll(node) {
      var win = getWindow(node);
      var scrollLeft = win.pageXOffset;
      var scrollTop = win.pageYOffset;
      return {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop
      };
    }

    function getWindowScrollBarX(element) {
      // If <html> has a CSS width greater than the viewport, then this will be
      // incorrect for RTL.
      // Popper 1 is broken in this case and never had a bug report so let's assume
      // it's not an issue. I don't think anyone ever specifies width on <html>
      // anyway.
      // Browsers where the left scrollbar doesn't cause an issue report `0` for
      // this (e.g. Edge 2019, IE11, Safari)
      return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
    }

    function getViewportRect(element) {
      var win = getWindow(element);
      var html = getDocumentElement(element);
      var visualViewport = win.visualViewport;
      var width = html.clientWidth;
      var height = html.clientHeight;
      var x = 0;
      var y = 0; // NB: This isn't supported on iOS <= 12. If the keyboard is open, the popper
      // can be obscured underneath it.
      // Also, `html.clientHeight` adds the bottom bar height in Safari iOS, even
      // if it isn't open, so if this isn't available, the popper will be detected
      // to overflow the bottom of the screen too early.

      if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height; // Uses Layout Viewport (like Chrome; Safari does not currently)
        // In Chrome, it returns a value very close to 0 (+/-) but contains rounding
        // errors due to floating point numbers, so we need to check precision.
        // Safari returns a number <= 0, usually < -1 when pinch-zoomed
        // Feature detection fails in mobile emulation mode in Chrome.
        // Math.abs(win.innerWidth / visualViewport.scale - visualViewport.width) <
        // 0.001
        // Fallback here: "Not Safari" userAgent

        if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          x = visualViewport.offsetLeft;
          y = visualViewport.offsetTop;
        }
      }

      return {
        width: width,
        height: height,
        x: x + getWindowScrollBarX(element),
        y: y
      };
    }

    // of the `<html>` and `<body>` rect bounds if horizontally scrollable

    function getDocumentRect(element) {
      var _element$ownerDocumen;

      var html = getDocumentElement(element);
      var winScroll = getWindowScroll(element);
      var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
      var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
      var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
      var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
      var y = -winScroll.scrollTop;

      if (getComputedStyle$1(body || html).direction === 'rtl') {
        x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
      }

      return {
        width: width,
        height: height,
        x: x,
        y: y
      };
    }

    function isScrollParent(element) {
      // Firefox wants us to check `-x` and `-y` variations as well
      var _getComputedStyle = getComputedStyle$1(element),
          overflow = _getComputedStyle.overflow,
          overflowX = _getComputedStyle.overflowX,
          overflowY = _getComputedStyle.overflowY;

      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }

    function getScrollParent(node) {
      if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
        // $FlowFixMe[incompatible-return]: assume body is always available
        return node.ownerDocument.body;
      }

      if (isHTMLElement(node) && isScrollParent(node)) {
        return node;
      }

      return getScrollParent(getParentNode(node));
    }

    /*
    given a DOM element, return the list of all scroll parents, up the list of ancesors
    until we get to the top window object. This list is what we attach scroll listeners
    to, because if any of these parent elements scroll, we'll need to re-calculate the
    reference element's position.
    */

    function listScrollParents(element, list) {
      var _element$ownerDocumen;

      if (list === void 0) {
        list = [];
      }

      var scrollParent = getScrollParent(element);
      var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
      var win = getWindow(scrollParent);
      var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
      var updatedList = list.concat(target);
      return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)));
    }

    function rectToClientRect(rect) {
      return Object.assign({}, rect, {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
      });
    }

    function getInnerBoundingClientRect(element) {
      var rect = getBoundingClientRect(element);
      rect.top = rect.top + element.clientTop;
      rect.left = rect.left + element.clientLeft;
      rect.bottom = rect.top + element.clientHeight;
      rect.right = rect.left + element.clientWidth;
      rect.width = element.clientWidth;
      rect.height = element.clientHeight;
      rect.x = rect.left;
      rect.y = rect.top;
      return rect;
    }

    function getClientRectFromMixedType(element, clippingParent) {
      return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isElement$1(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
    } // A "clipping parent" is an overflowable container with the characteristic of
    // clipping (or hiding) overflowing elements with a position different from
    // `initial`


    function getClippingParents(element) {
      var clippingParents = listScrollParents(getParentNode(element));
      var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle$1(element).position) >= 0;
      var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

      if (!isElement$1(clipperElement)) {
        return [];
      } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414


      return clippingParents.filter(function (clippingParent) {
        return isElement$1(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== 'body';
      });
    } // Gets the maximum area that the element is visible in due to any number of
    // clipping parents


    function getClippingRect(element, boundary, rootBoundary) {
      var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
      var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
      var firstClippingParent = clippingParents[0];
      var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
        var rect = getClientRectFromMixedType(element, clippingParent);
        accRect.top = max(rect.top, accRect.top);
        accRect.right = min(rect.right, accRect.right);
        accRect.bottom = min(rect.bottom, accRect.bottom);
        accRect.left = max(rect.left, accRect.left);
        return accRect;
      }, getClientRectFromMixedType(element, firstClippingParent));
      clippingRect.width = clippingRect.right - clippingRect.left;
      clippingRect.height = clippingRect.bottom - clippingRect.top;
      clippingRect.x = clippingRect.left;
      clippingRect.y = clippingRect.top;
      return clippingRect;
    }

    function computeOffsets(_ref) {
      var reference = _ref.reference,
          element = _ref.element,
          placement = _ref.placement;
      var basePlacement = placement ? getBasePlacement(placement) : null;
      var variation = placement ? getVariation(placement) : null;
      var commonX = reference.x + reference.width / 2 - element.width / 2;
      var commonY = reference.y + reference.height / 2 - element.height / 2;
      var offsets;

      switch (basePlacement) {
        case top:
          offsets = {
            x: commonX,
            y: reference.y - element.height
          };
          break;

        case bottom:
          offsets = {
            x: commonX,
            y: reference.y + reference.height
          };
          break;

        case right:
          offsets = {
            x: reference.x + reference.width,
            y: commonY
          };
          break;

        case left:
          offsets = {
            x: reference.x - element.width,
            y: commonY
          };
          break;

        default:
          offsets = {
            x: reference.x,
            y: reference.y
          };
      }

      var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

      if (mainAxis != null) {
        var len = mainAxis === 'y' ? 'height' : 'width';

        switch (variation) {
          case start:
            offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
            break;

          case end:
            offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
            break;
        }
      }

      return offsets;
    }

    function detectOverflow(state, options) {
      if (options === void 0) {
        options = {};
      }

      var _options = options,
          _options$placement = _options.placement,
          placement = _options$placement === void 0 ? state.placement : _options$placement,
          _options$boundary = _options.boundary,
          boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
          _options$rootBoundary = _options.rootBoundary,
          rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
          _options$elementConte = _options.elementContext,
          elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
          _options$altBoundary = _options.altBoundary,
          altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
          _options$padding = _options.padding,
          padding = _options$padding === void 0 ? 0 : _options$padding;
      var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
      var altContext = elementContext === popper ? reference : popper;
      var popperRect = state.rects.popper;
      var element = state.elements[altBoundary ? altContext : elementContext];
      var clippingClientRect = getClippingRect(isElement$1(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
      var referenceClientRect = getBoundingClientRect(state.elements.reference);
      var popperOffsets = computeOffsets({
        reference: referenceClientRect,
        element: popperRect,
        strategy: 'absolute',
        placement: placement
      });
      var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
      var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
      // 0 or negative = within the clipping rect

      var overflowOffsets = {
        top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
        bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
        left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
        right: elementClientRect.right - clippingClientRect.right + paddingObject.right
      };
      var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

      if (elementContext === popper && offsetData) {
        var offset = offsetData[placement];
        Object.keys(overflowOffsets).forEach(function (key) {
          var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
          var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
          overflowOffsets[key] += offset[axis] * multiply;
        });
      }

      return overflowOffsets;
    }

    function computeAutoPlacement(state, options) {
      if (options === void 0) {
        options = {};
      }

      var _options = options,
          placement = _options.placement,
          boundary = _options.boundary,
          rootBoundary = _options.rootBoundary,
          padding = _options.padding,
          flipVariations = _options.flipVariations,
          _options$allowedAutoP = _options.allowedAutoPlacements,
          allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
      var variation = getVariation(placement);
      var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
        return getVariation(placement) === variation;
      }) : basePlacements;
      var allowedPlacements = placements$1.filter(function (placement) {
        return allowedAutoPlacements.indexOf(placement) >= 0;
      });

      if (allowedPlacements.length === 0) {
        allowedPlacements = placements$1;

        if (process.env.NODE_ENV !== "production") {
          console.error(['Popper: The `allowedAutoPlacements` option did not allow any', 'placements. Ensure the `placement` option matches the variation', 'of the allowed placements.', 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(' '));
        }
      } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...


      var overflows = allowedPlacements.reduce(function (acc, placement) {
        acc[placement] = detectOverflow(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          padding: padding
        })[getBasePlacement(placement)];
        return acc;
      }, {});
      return Object.keys(overflows).sort(function (a, b) {
        return overflows[a] - overflows[b];
      });
    }

    function getExpandedFallbackPlacements(placement) {
      if (getBasePlacement(placement) === auto) {
        return [];
      }

      var oppositePlacement = getOppositePlacement(placement);
      return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
    }

    function flip(_ref) {
      var state = _ref.state,
          options = _ref.options,
          name = _ref.name;

      if (state.modifiersData[name]._skip) {
        return;
      }

      var _options$mainAxis = options.mainAxis,
          checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
          _options$altAxis = options.altAxis,
          checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
          specifiedFallbackPlacements = options.fallbackPlacements,
          padding = options.padding,
          boundary = options.boundary,
          rootBoundary = options.rootBoundary,
          altBoundary = options.altBoundary,
          _options$flipVariatio = options.flipVariations,
          flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
          allowedAutoPlacements = options.allowedAutoPlacements;
      var preferredPlacement = state.options.placement;
      var basePlacement = getBasePlacement(preferredPlacement);
      var isBasePlacement = basePlacement === preferredPlacement;
      var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
      var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
        return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          padding: padding,
          flipVariations: flipVariations,
          allowedAutoPlacements: allowedAutoPlacements
        }) : placement);
      }, []);
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var checksMap = new Map();
      var makeFallbackChecks = true;
      var firstFittingPlacement = placements[0];

      for (var i = 0; i < placements.length; i++) {
        var placement = placements[i];

        var _basePlacement = getBasePlacement(placement);

        var isStartVariation = getVariation(placement) === start;
        var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
        var len = isVertical ? 'width' : 'height';
        var overflow = detectOverflow(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          altBoundary: altBoundary,
          padding: padding
        });
        var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

        if (referenceRect[len] > popperRect[len]) {
          mainVariationSide = getOppositePlacement(mainVariationSide);
        }

        var altVariationSide = getOppositePlacement(mainVariationSide);
        var checks = [];

        if (checkMainAxis) {
          checks.push(overflow[_basePlacement] <= 0);
        }

        if (checkAltAxis) {
          checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
        }

        if (checks.every(function (check) {
          return check;
        })) {
          firstFittingPlacement = placement;
          makeFallbackChecks = false;
          break;
        }

        checksMap.set(placement, checks);
      }

      if (makeFallbackChecks) {
        // `2` may be desired in some cases – research later
        var numberOfChecks = flipVariations ? 3 : 1;

        var _loop = function _loop(_i) {
          var fittingPlacement = placements.find(function (placement) {
            var checks = checksMap.get(placement);

            if (checks) {
              return checks.slice(0, _i).every(function (check) {
                return check;
              });
            }
          });

          if (fittingPlacement) {
            firstFittingPlacement = fittingPlacement;
            return "break";
          }
        };

        for (var _i = numberOfChecks; _i > 0; _i--) {
          var _ret = _loop(_i);

          if (_ret === "break") break;
        }
      }

      if (state.placement !== firstFittingPlacement) {
        state.modifiersData[name]._skip = true;
        state.placement = firstFittingPlacement;
        state.reset = true;
      }
    } // eslint-disable-next-line import/no-unused-modules


    var flip$1 = {
      name: 'flip',
      enabled: true,
      phase: 'main',
      fn: flip,
      requiresIfExists: ['offset'],
      data: {
        _skip: false
      }
    };

    function getSideOffsets(overflow, rect, preventedOffsets) {
      if (preventedOffsets === void 0) {
        preventedOffsets = {
          x: 0,
          y: 0
        };
      }

      return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x
      };
    }

    function isAnySideFullyClipped(overflow) {
      return [top, right, bottom, left].some(function (side) {
        return overflow[side] >= 0;
      });
    }

    function hide(_ref) {
      var state = _ref.state,
          name = _ref.name;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var preventedOffsets = state.modifiersData.preventOverflow;
      var referenceOverflow = detectOverflow(state, {
        elementContext: 'reference'
      });
      var popperAltOverflow = detectOverflow(state, {
        altBoundary: true
      });
      var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
      var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
      var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
      var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
      state.modifiersData[name] = {
        referenceClippingOffsets: referenceClippingOffsets,
        popperEscapeOffsets: popperEscapeOffsets,
        isReferenceHidden: isReferenceHidden,
        hasPopperEscaped: hasPopperEscaped
      };
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        'data-popper-reference-hidden': isReferenceHidden,
        'data-popper-escaped': hasPopperEscaped
      });
    } // eslint-disable-next-line import/no-unused-modules


    var hide$1 = {
      name: 'hide',
      enabled: true,
      phase: 'main',
      requiresIfExists: ['preventOverflow'],
      fn: hide
    };

    function distanceAndSkiddingToXY(placement, rects, offset) {
      var basePlacement = getBasePlacement(placement);
      var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

      var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
        placement: placement
      })) : offset,
          skidding = _ref[0],
          distance = _ref[1];

      skidding = skidding || 0;
      distance = (distance || 0) * invertDistance;
      return [left, right].indexOf(basePlacement) >= 0 ? {
        x: distance,
        y: skidding
      } : {
        x: skidding,
        y: distance
      };
    }

    function offset(_ref2) {
      var state = _ref2.state,
          options = _ref2.options,
          name = _ref2.name;
      var _options$offset = options.offset,
          offset = _options$offset === void 0 ? [0, 0] : _options$offset;
      var data = placements.reduce(function (acc, placement) {
        acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
        return acc;
      }, {});
      var _data$state$placement = data[state.placement],
          x = _data$state$placement.x,
          y = _data$state$placement.y;

      if (state.modifiersData.popperOffsets != null) {
        state.modifiersData.popperOffsets.x += x;
        state.modifiersData.popperOffsets.y += y;
      }

      state.modifiersData[name] = data;
    } // eslint-disable-next-line import/no-unused-modules


    var offset$1 = {
      name: 'offset',
      enabled: true,
      phase: 'main',
      requires: ['popperOffsets'],
      fn: offset
    };

    function popperOffsets(_ref) {
      var state = _ref.state,
          name = _ref.name;
      // Offsets are the actual position the popper needs to have to be
      // properly positioned near its reference element
      // This is the most basic placement, and will be adjusted by
      // the modifiers in the next step
      state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        strategy: 'absolute',
        placement: state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var popperOffsets$1 = {
      name: 'popperOffsets',
      enabled: true,
      phase: 'read',
      fn: popperOffsets,
      data: {}
    };

    function getAltAxis(axis) {
      return axis === 'x' ? 'y' : 'x';
    }

    function preventOverflow(_ref) {
      var state = _ref.state,
          options = _ref.options,
          name = _ref.name;
      var _options$mainAxis = options.mainAxis,
          checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
          _options$altAxis = options.altAxis,
          checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
          boundary = options.boundary,
          rootBoundary = options.rootBoundary,
          altBoundary = options.altBoundary,
          padding = options.padding,
          _options$tether = options.tether,
          tether = _options$tether === void 0 ? true : _options$tether,
          _options$tetherOffset = options.tetherOffset,
          tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
      var overflow = detectOverflow(state, {
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding,
        altBoundary: altBoundary
      });
      var basePlacement = getBasePlacement(state.placement);
      var variation = getVariation(state.placement);
      var isBasePlacement = !variation;
      var mainAxis = getMainAxisFromPlacement(basePlacement);
      var altAxis = getAltAxis(mainAxis);
      var popperOffsets = state.modifiersData.popperOffsets;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
        placement: state.placement
      })) : tetherOffset;
      var normalizedTetherOffsetValue = typeof tetherOffsetValue === 'number' ? {
        mainAxis: tetherOffsetValue,
        altAxis: tetherOffsetValue
      } : Object.assign({
        mainAxis: 0,
        altAxis: 0
      }, tetherOffsetValue);
      var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
      var data = {
        x: 0,
        y: 0
      };

      if (!popperOffsets) {
        return;
      }

      if (checkMainAxis) {
        var _offsetModifierState$;

        var mainSide = mainAxis === 'y' ? top : left;
        var altSide = mainAxis === 'y' ? bottom : right;
        var len = mainAxis === 'y' ? 'height' : 'width';
        var offset = popperOffsets[mainAxis];
        var min$1 = offset + overflow[mainSide];
        var max$1 = offset - overflow[altSide];
        var additive = tether ? -popperRect[len] / 2 : 0;
        var minLen = variation === start ? referenceRect[len] : popperRect[len];
        var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
        // outside the reference bounds

        var arrowElement = state.elements.arrow;
        var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
          width: 0,
          height: 0
        };
        var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
        var arrowPaddingMin = arrowPaddingObject[mainSide];
        var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
        // to include its full size in the calculation. If the reference is small
        // and near the edge of a boundary, the popper can overflow even if the
        // reference is not overflowing as well (e.g. virtual elements with no
        // width or height)

        var arrowLen = within(0, referenceRect[len], arrowRect[len]);
        var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
        var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
        var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
        var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
        var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
        var tetherMin = offset + minOffset - offsetModifierValue - clientOffset;
        var tetherMax = offset + maxOffset - offsetModifierValue;
        var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
        popperOffsets[mainAxis] = preventedOffset;
        data[mainAxis] = preventedOffset - offset;
      }

      if (checkAltAxis) {
        var _offsetModifierState$2;

        var _mainSide = mainAxis === 'x' ? top : left;

        var _altSide = mainAxis === 'x' ? bottom : right;

        var _offset = popperOffsets[altAxis];

        var _len = altAxis === 'y' ? 'height' : 'width';

        var _min = _offset + overflow[_mainSide];

        var _max = _offset - overflow[_altSide];

        var isOriginSide = [top, left].indexOf(basePlacement) !== -1;

        var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;

        var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;

        var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;

        var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);

        popperOffsets[altAxis] = _preventedOffset;
        data[altAxis] = _preventedOffset - _offset;
      }

      state.modifiersData[name] = data;
    } // eslint-disable-next-line import/no-unused-modules


    var preventOverflow$1 = {
      name: 'preventOverflow',
      enabled: true,
      phase: 'main',
      fn: preventOverflow,
      requiresIfExists: ['offset']
    };

    function getHTMLElementScroll(element) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }

    function getNodeScroll(node) {
      if (node === getWindow(node) || !isHTMLElement(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    }

    function isElementScaled(element) {
      var rect = element.getBoundingClientRect();
      var scaleX = round(rect.width) / element.offsetWidth || 1;
      var scaleY = round(rect.height) / element.offsetHeight || 1;
      return scaleX !== 1 || scaleY !== 1;
    } // Returns the composite rect of an element relative to its offsetParent.
    // Composite means it takes into account transforms as well as layout.


    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }

      var isOffsetParentAnElement = isHTMLElement(offsetParent);
      var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
      var documentElement = getDocumentElement(offsetParent);
      var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled);
      var scroll = {
        scrollLeft: 0,
        scrollTop: 0
      };
      var offsets = {
        x: 0,
        y: 0
      };

      if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
        isScrollParent(documentElement)) {
          scroll = getNodeScroll(offsetParent);
        }

        if (isHTMLElement(offsetParent)) {
          offsets = getBoundingClientRect(offsetParent, true);
          offsets.x += offsetParent.clientLeft;
          offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
          offsets.x = getWindowScrollBarX(documentElement);
        }
      }

      return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
      };
    }

    function order(modifiers) {
      var map = new Map();
      var visited = new Set();
      var result = [];
      modifiers.forEach(function (modifier) {
        map.set(modifier.name, modifier);
      }); // On visiting object, check for its dependencies and visit them recursively

      function sort(modifier) {
        visited.add(modifier.name);
        var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
        requires.forEach(function (dep) {
          if (!visited.has(dep)) {
            var depModifier = map.get(dep);

            if (depModifier) {
              sort(depModifier);
            }
          }
        });
        result.push(modifier);
      }

      modifiers.forEach(function (modifier) {
        if (!visited.has(modifier.name)) {
          // check for visited object
          sort(modifier);
        }
      });
      return result;
    }

    function orderModifiers(modifiers) {
      // order based on dependencies
      var orderedModifiers = order(modifiers); // order based on phase

      return modifierPhases.reduce(function (acc, phase) {
        return acc.concat(orderedModifiers.filter(function (modifier) {
          return modifier.phase === phase;
        }));
      }, []);
    }

    function debounce(fn) {
      var pending;
      return function () {
        if (!pending) {
          pending = new Promise(function (resolve) {
            Promise.resolve().then(function () {
              pending = undefined;
              resolve(fn());
            });
          });
        }

        return pending;
      };
    }

    function format(str) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return [].concat(args).reduce(function (p, c) {
        return p.replace(/%s/, c);
      }, str);
    }

    var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
    var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
    var VALID_PROPERTIES = ['name', 'enabled', 'phase', 'fn', 'effect', 'requires', 'options'];
    function validateModifiers(modifiers) {
      modifiers.forEach(function (modifier) {
        [].concat(Object.keys(modifier), VALID_PROPERTIES) // IE11-compatible replacement for `new Set(iterable)`
        .filter(function (value, index, self) {
          return self.indexOf(value) === index;
        }).forEach(function (key) {
          switch (key) {
            case 'name':
              if (typeof modifier.name !== 'string') {
                console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', "\"" + String(modifier.name) + "\""));
              }

              break;

            case 'enabled':
              if (typeof modifier.enabled !== 'boolean') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', "\"" + String(modifier.enabled) + "\""));
              }

              break;

            case 'phase':
              if (modifierPhases.indexOf(modifier.phase) < 0) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(', '), "\"" + String(modifier.phase) + "\""));
              }

              break;

            case 'fn':
              if (typeof modifier.fn !== 'function') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', "\"" + String(modifier.fn) + "\""));
              }

              break;

            case 'effect':
              if (modifier.effect != null && typeof modifier.effect !== 'function') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', "\"" + String(modifier.fn) + "\""));
              }

              break;

            case 'requires':
              if (modifier.requires != null && !Array.isArray(modifier.requires)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', "\"" + String(modifier.requires) + "\""));
              }

              break;

            case 'requiresIfExists':
              if (!Array.isArray(modifier.requiresIfExists)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', "\"" + String(modifier.requiresIfExists) + "\""));
              }

              break;

            case 'options':
            case 'data':
              break;

            default:
              console.error("PopperJS: an invalid property has been provided to the \"" + modifier.name + "\" modifier, valid properties are " + VALID_PROPERTIES.map(function (s) {
                return "\"" + s + "\"";
              }).join(', ') + "; but \"" + key + "\" was provided.");
          }

          modifier.requires && modifier.requires.forEach(function (requirement) {
            if (modifiers.find(function (mod) {
              return mod.name === requirement;
            }) == null) {
              console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
            }
          });
        });
      });
    }

    function uniqueBy(arr, fn) {
      var identifiers = new Set();
      return arr.filter(function (item) {
        var identifier = fn(item);

        if (!identifiers.has(identifier)) {
          identifiers.add(identifier);
          return true;
        }
      });
    }

    function mergeByName(modifiers) {
      var merged = modifiers.reduce(function (merged, current) {
        var existing = merged[current.name];
        merged[current.name] = existing ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data)
        }) : current;
        return merged;
      }, {}); // IE11 does not support Object.values

      return Object.keys(merged).map(function (key) {
        return merged[key];
      });
    }

    var INVALID_ELEMENT_ERROR = 'Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.';
    var INFINITE_LOOP_ERROR = 'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';
    var DEFAULT_OPTIONS = {
      placement: 'bottom',
      modifiers: [],
      strategy: 'absolute'
    };

    function areValidElements() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return !args.some(function (element) {
        return !(element && typeof element.getBoundingClientRect === 'function');
      });
    }

    function popperGenerator(generatorOptions) {
      if (generatorOptions === void 0) {
        generatorOptions = {};
      }

      var _generatorOptions = generatorOptions,
          _generatorOptions$def = _generatorOptions.defaultModifiers,
          defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
          _generatorOptions$def2 = _generatorOptions.defaultOptions,
          defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
      return function createPopper(reference, popper, options) {
        if (options === void 0) {
          options = defaultOptions;
        }

        var state = {
          placement: 'bottom',
          orderedModifiers: [],
          options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
          modifiersData: {},
          elements: {
            reference: reference,
            popper: popper
          },
          attributes: {},
          styles: {}
        };
        var effectCleanupFns = [];
        var isDestroyed = false;
        var instance = {
          state: state,
          setOptions: function setOptions(setOptionsAction) {
            var options = typeof setOptionsAction === 'function' ? setOptionsAction(state.options) : setOptionsAction;
            cleanupModifierEffects();
            state.options = Object.assign({}, defaultOptions, state.options, options);
            state.scrollParents = {
              reference: isElement$1(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
              popper: listScrollParents(popper)
            }; // Orders the modifiers based on their dependencies and `phase`
            // properties

            var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

            state.orderedModifiers = orderedModifiers.filter(function (m) {
              return m.enabled;
            }); // Validate the provided modifiers so that the consumer will get warned
            // if one of the modifiers is invalid for any reason

            if (process.env.NODE_ENV !== "production") {
              var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function (_ref) {
                var name = _ref.name;
                return name;
              });
              validateModifiers(modifiers);

              if (getBasePlacement(state.options.placement) === auto) {
                var flipModifier = state.orderedModifiers.find(function (_ref2) {
                  var name = _ref2.name;
                  return name === 'flip';
                });

                if (!flipModifier) {
                  console.error(['Popper: "auto" placements require the "flip" modifier be', 'present and enabled to work.'].join(' '));
                }
              }

              var _getComputedStyle = getComputedStyle$1(popper),
                  marginTop = _getComputedStyle.marginTop,
                  marginRight = _getComputedStyle.marginRight,
                  marginBottom = _getComputedStyle.marginBottom,
                  marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
              // cause bugs with positioning, so we'll warn the consumer


              if ([marginTop, marginRight, marginBottom, marginLeft].some(function (margin) {
                return parseFloat(margin);
              })) {
                console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', 'between the popper and its reference element or boundary.', 'To replicate margin, use the `offset` modifier, as well as', 'the `padding` option in the `preventOverflow` and `flip`', 'modifiers.'].join(' '));
              }
            }

            runModifierEffects();
            return instance.update();
          },
          // Sync update – it will always be executed, even if not necessary. This
          // is useful for low frequency updates where sync behavior simplifies the
          // logic.
          // For high frequency updates (e.g. `resize` and `scroll` events), always
          // prefer the async Popper#update method
          forceUpdate: function forceUpdate() {
            if (isDestroyed) {
              return;
            }

            var _state$elements = state.elements,
                reference = _state$elements.reference,
                popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
            // anymore

            if (!areValidElements(reference, popper)) {
              if (process.env.NODE_ENV !== "production") {
                console.error(INVALID_ELEMENT_ERROR);
              }

              return;
            } // Store the reference and popper rects to be read by modifiers


            state.rects = {
              reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
              popper: getLayoutRect(popper)
            }; // Modifiers have the ability to reset the current update cycle. The
            // most common use case for this is the `flip` modifier changing the
            // placement, which then needs to re-run all the modifiers, because the
            // logic was previously ran for the previous placement and is therefore
            // stale/incorrect

            state.reset = false;
            state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
            // is filled with the initial data specified by the modifier. This means
            // it doesn't persist and is fresh on each update.
            // To ensure persistent data, use `${name}#persistent`

            state.orderedModifiers.forEach(function (modifier) {
              return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
            });
            var __debug_loops__ = 0;

            for (var index = 0; index < state.orderedModifiers.length; index++) {
              if (process.env.NODE_ENV !== "production") {
                __debug_loops__ += 1;

                if (__debug_loops__ > 100) {
                  console.error(INFINITE_LOOP_ERROR);
                  break;
                }
              }

              if (state.reset === true) {
                state.reset = false;
                index = -1;
                continue;
              }

              var _state$orderedModifie = state.orderedModifiers[index],
                  fn = _state$orderedModifie.fn,
                  _state$orderedModifie2 = _state$orderedModifie.options,
                  _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
                  name = _state$orderedModifie.name;

              if (typeof fn === 'function') {
                state = fn({
                  state: state,
                  options: _options,
                  name: name,
                  instance: instance
                }) || state;
              }
            }
          },
          // Async and optimistically optimized update – it will not be executed if
          // not necessary (debounced to run at most once-per-tick)
          update: debounce(function () {
            return new Promise(function (resolve) {
              instance.forceUpdate();
              resolve(state);
            });
          }),
          destroy: function destroy() {
            cleanupModifierEffects();
            isDestroyed = true;
          }
        };

        if (!areValidElements(reference, popper)) {
          if (process.env.NODE_ENV !== "production") {
            console.error(INVALID_ELEMENT_ERROR);
          }

          return instance;
        }

        instance.setOptions(options).then(function (state) {
          if (!isDestroyed && options.onFirstUpdate) {
            options.onFirstUpdate(state);
          }
        }); // Modifiers have the ability to execute arbitrary code before the first
        // update cycle runs. They will be executed in the same order as the update
        // cycle. This is useful when a modifier adds some persistent data that
        // other modifiers need to use, but the modifier is run after the dependent
        // one.

        function runModifierEffects() {
          state.orderedModifiers.forEach(function (_ref3) {
            var name = _ref3.name,
                _ref3$options = _ref3.options,
                options = _ref3$options === void 0 ? {} : _ref3$options,
                effect = _ref3.effect;

            if (typeof effect === 'function') {
              var cleanupFn = effect({
                state: state,
                name: name,
                instance: instance,
                options: options
              });

              var noopFn = function noopFn() {};

              effectCleanupFns.push(cleanupFn || noopFn);
            }
          });
        }

        function cleanupModifierEffects() {
          effectCleanupFns.forEach(function (fn) {
            return fn();
          });
          effectCleanupFns = [];
        }

        return instance;
      };
    }
    var createPopper$2 = /*#__PURE__*/popperGenerator(); // eslint-disable-next-line import/no-unused-modules

    var defaultModifiers$1 = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1];
    var createPopper$1 = /*#__PURE__*/popperGenerator({
      defaultModifiers: defaultModifiers$1
    }); // eslint-disable-next-line import/no-unused-modules

    var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
    var createPopper = /*#__PURE__*/popperGenerator({
      defaultModifiers: defaultModifiers
    }); // eslint-disable-next-line import/no-unused-modules

    var Popper = /*#__PURE__*/Object.freeze({
        __proto__: null,
        popperGenerator: popperGenerator,
        detectOverflow: detectOverflow,
        createPopperBase: createPopper$2,
        createPopper: createPopper,
        createPopperLite: createPopper$1,
        top: top,
        bottom: bottom,
        right: right,
        left: left,
        auto: auto,
        basePlacements: basePlacements,
        start: start,
        end: end,
        clippingParents: clippingParents,
        viewport: viewport,
        popper: popper,
        reference: reference,
        variationPlacements: variationPlacements,
        placements: placements,
        beforeRead: beforeRead,
        read: read,
        afterRead: afterRead,
        beforeMain: beforeMain,
        main: main,
        afterMain: afterMain,
        beforeWrite: beforeWrite,
        write: write,
        afterWrite: afterWrite,
        modifierPhases: modifierPhases,
        applyStyles: applyStyles$1,
        arrow: arrow$1,
        computeStyles: computeStyles$1,
        eventListeners: eventListeners,
        flip: flip$1,
        hide: hide$1,
        offset: offset$1,
        popperOffsets: popperOffsets$1,
        preventOverflow: preventOverflow$1
    });

    /*!
      * Bootstrap v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/index.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const MAX_UID = 1000000;
    const MILLISECONDS_MULTIPLIER = 1000;
    const TRANSITION_END = 'transitionend'; // Shoutout AngusCroll (https://goo.gl/pxwQGp)

    const toType = obj => {
      if (obj === null || obj === undefined) {
        return `${obj}`;
      }

      return {}.toString.call(obj).match(/\s([a-z]+)/i)[1].toLowerCase();
    };
    /**
     * --------------------------------------------------------------------------
     * Public Util Api
     * --------------------------------------------------------------------------
     */


    const getUID = prefix => {
      do {
        prefix += Math.floor(Math.random() * MAX_UID);
      } while (document.getElementById(prefix));

      return prefix;
    };

    const getSelector = element => {
      let selector = element.getAttribute('data-bs-target');

      if (!selector || selector === '#') {
        let hrefAttr = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
        // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
        // `document.querySelector` will rightfully complain it is invalid.
        // See https://github.com/twbs/bootstrap/issues/32273

        if (!hrefAttr || !hrefAttr.includes('#') && !hrefAttr.startsWith('.')) {
          return null;
        } // Just in case some CMS puts out a full URL with the anchor appended


        if (hrefAttr.includes('#') && !hrefAttr.startsWith('#')) {
          hrefAttr = `#${hrefAttr.split('#')[1]}`;
        }

        selector = hrefAttr && hrefAttr !== '#' ? hrefAttr.trim() : null;
      }

      return selector;
    };

    const getSelectorFromElement = element => {
      const selector = getSelector(element);

      if (selector) {
        return document.querySelector(selector) ? selector : null;
      }

      return null;
    };

    const getElementFromSelector = element => {
      const selector = getSelector(element);
      return selector ? document.querySelector(selector) : null;
    };

    const getTransitionDurationFromElement = element => {
      if (!element) {
        return 0;
      } // Get transition-duration of the element


      let {
        transitionDuration,
        transitionDelay
      } = window.getComputedStyle(element);
      const floatTransitionDuration = Number.parseFloat(transitionDuration);
      const floatTransitionDelay = Number.parseFloat(transitionDelay); // Return 0 if element or transition duration is not found

      if (!floatTransitionDuration && !floatTransitionDelay) {
        return 0;
      } // If multiple durations are defined, take the first


      transitionDuration = transitionDuration.split(',')[0];
      transitionDelay = transitionDelay.split(',')[0];
      return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
    };

    const triggerTransitionEnd = element => {
      element.dispatchEvent(new Event(TRANSITION_END));
    };

    const isElement = obj => {
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      if (typeof obj.jquery !== 'undefined') {
        obj = obj[0];
      }

      return typeof obj.nodeType !== 'undefined';
    };

    const getElement = obj => {
      if (isElement(obj)) {
        // it's a jQuery object or a node element
        return obj.jquery ? obj[0] : obj;
      }

      if (typeof obj === 'string' && obj.length > 0) {
        return document.querySelector(obj);
      }

      return null;
    };

    const typeCheckConfig = (componentName, config, configTypes) => {
      Object.keys(configTypes).forEach(property => {
        const expectedTypes = configTypes[property];
        const value = config[property];
        const valueType = value && isElement(value) ? 'element' : toType(value);

        if (!new RegExp(expectedTypes).test(valueType)) {
          throw new TypeError(`${componentName.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
        }
      });
    };

    const isVisible = element => {
      if (!isElement(element) || element.getClientRects().length === 0) {
        return false;
      }

      return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
    };

    const isDisabled = element => {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return true;
      }

      if (element.classList.contains('disabled')) {
        return true;
      }

      if (typeof element.disabled !== 'undefined') {
        return element.disabled;
      }

      return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
    };

    const findShadowRoot = element => {
      if (!document.documentElement.attachShadow) {
        return null;
      } // Can find the shadow root otherwise it'll return the document


      if (typeof element.getRootNode === 'function') {
        const root = element.getRootNode();
        return root instanceof ShadowRoot ? root : null;
      }

      if (element instanceof ShadowRoot) {
        return element;
      } // when we don't find a shadow root


      if (!element.parentNode) {
        return null;
      }

      return findShadowRoot(element.parentNode);
    };

    const noop = () => {};
    /**
     * Trick to restart an element's animation
     *
     * @param {HTMLElement} element
     * @return void
     *
     * @see https://www.charistheo.io/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
     */


    const reflow = element => {
      // eslint-disable-next-line no-unused-expressions
      element.offsetHeight;
    };

    const getjQuery = () => {
      const {
        jQuery
      } = window;

      if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
        return jQuery;
      }

      return null;
    };

    const DOMContentLoadedCallbacks = [];

    const onDOMContentLoaded = callback => {
      if (document.readyState === 'loading') {
        // add listener on the first call when the document is in loading state
        if (!DOMContentLoadedCallbacks.length) {
          document.addEventListener('DOMContentLoaded', () => {
            DOMContentLoadedCallbacks.forEach(callback => callback());
          });
        }

        DOMContentLoadedCallbacks.push(callback);
      } else {
        callback();
      }
    };

    const isRTL = () => document.documentElement.dir === 'rtl';

    const defineJQueryPlugin = plugin => {
      onDOMContentLoaded(() => {
        const $ = getjQuery();
        /* istanbul ignore if */

        if ($) {
          const name = plugin.NAME;
          const JQUERY_NO_CONFLICT = $.fn[name];
          $.fn[name] = plugin.jQueryInterface;
          $.fn[name].Constructor = plugin;

          $.fn[name].noConflict = () => {
            $.fn[name] = JQUERY_NO_CONFLICT;
            return plugin.jQueryInterface;
          };
        }
      });
    };

    const execute = callback => {
      if (typeof callback === 'function') {
        callback();
      }
    };

    const executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
      if (!waitForTransition) {
        execute(callback);
        return;
      }

      const durationPadding = 5;
      const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
      let called = false;

      const handler = ({
        target
      }) => {
        if (target !== transitionElement) {
          return;
        }

        called = true;
        transitionElement.removeEventListener(TRANSITION_END, handler);
        execute(callback);
      };

      transitionElement.addEventListener(TRANSITION_END, handler);
      setTimeout(() => {
        if (!called) {
          triggerTransitionEnd(transitionElement);
        }
      }, emulatedDuration);
    };
    /**
     * Return the previous/next element of a list.
     *
     * @param {array} list    The list of elements
     * @param activeElement   The active element
     * @param shouldGetNext   Choose to get next or previous element
     * @param isCycleAllowed
     * @return {Element|elem} The proper element
     */


    const getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
      let index = list.indexOf(activeElement); // if the element does not exist in the list return an element depending on the direction and if cycle is allowed

      if (index === -1) {
        return list[!shouldGetNext && isCycleAllowed ? list.length - 1 : 0];
      }

      const listLength = list.length;
      index += shouldGetNext ? 1 : -1;

      if (isCycleAllowed) {
        index = (index + listLength) % listLength;
      }

      return list[Math.max(0, Math.min(index, listLength - 1))];
    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): dom/event-handler.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
    const stripNameRegex = /\..*/;
    const stripUidRegex = /::\d+$/;
    const eventRegistry = {}; // Events storage

    let uidEvent = 1;
    const customEvents = {
      mouseenter: 'mouseover',
      mouseleave: 'mouseout'
    };
    const customEventsRegex = /^(mouseenter|mouseleave)/i;
    const nativeEvents = new Set(['click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu', 'mousewheel', 'DOMMouseScroll', 'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend', 'keydown', 'keypress', 'keyup', 'orientationchange', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup', 'pointerleave', 'pointercancel', 'gesturestart', 'gesturechange', 'gestureend', 'focus', 'blur', 'change', 'reset', 'select', 'submit', 'focusin', 'focusout', 'load', 'unload', 'beforeunload', 'resize', 'move', 'DOMContentLoaded', 'readystatechange', 'error', 'abort', 'scroll']);
    /**
     * ------------------------------------------------------------------------
     * Private methods
     * ------------------------------------------------------------------------
     */

    function getUidEvent(element, uid) {
      return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
    }

    function getEvent(element) {
      const uid = getUidEvent(element);
      element.uidEvent = uid;
      eventRegistry[uid] = eventRegistry[uid] || {};
      return eventRegistry[uid];
    }

    function bootstrapHandler(element, fn) {
      return function handler(event) {
        event.delegateTarget = element;

        if (handler.oneOff) {
          EventHandler.off(element, event.type, fn);
        }

        return fn.apply(element, [event]);
      };
    }

    function bootstrapDelegationHandler(element, selector, fn) {
      return function handler(event) {
        const domElements = element.querySelectorAll(selector);

        for (let {
          target
        } = event; target && target !== this; target = target.parentNode) {
          for (let i = domElements.length; i--;) {
            if (domElements[i] === target) {
              event.delegateTarget = target;

              if (handler.oneOff) {
                EventHandler.off(element, event.type, selector, fn);
              }

              return fn.apply(target, [event]);
            }
          }
        } // To please ESLint


        return null;
      };
    }

    function findHandler(events, handler, delegationSelector = null) {
      const uidEventList = Object.keys(events);

      for (let i = 0, len = uidEventList.length; i < len; i++) {
        const event = events[uidEventList[i]];

        if (event.originalHandler === handler && event.delegationSelector === delegationSelector) {
          return event;
        }
      }

      return null;
    }

    function normalizeParams(originalTypeEvent, handler, delegationFn) {
      const delegation = typeof handler === 'string';
      const originalHandler = delegation ? delegationFn : handler;
      let typeEvent = getTypeEvent(originalTypeEvent);
      const isNative = nativeEvents.has(typeEvent);

      if (!isNative) {
        typeEvent = originalTypeEvent;
      }

      return [delegation, originalHandler, typeEvent];
    }

    function addHandler(element, originalTypeEvent, handler, delegationFn, oneOff) {
      if (typeof originalTypeEvent !== 'string' || !element) {
        return;
      }

      if (!handler) {
        handler = delegationFn;
        delegationFn = null;
      } // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
      // this prevents the handler from being dispatched the same way as mouseover or mouseout does


      if (customEventsRegex.test(originalTypeEvent)) {
        const wrapFn = fn => {
          return function (event) {
            if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
              return fn.call(this, event);
            }
          };
        };

        if (delegationFn) {
          delegationFn = wrapFn(delegationFn);
        } else {
          handler = wrapFn(handler);
        }
      }

      const [delegation, originalHandler, typeEvent] = normalizeParams(originalTypeEvent, handler, delegationFn);
      const events = getEvent(element);
      const handlers = events[typeEvent] || (events[typeEvent] = {});
      const previousFn = findHandler(handlers, originalHandler, delegation ? handler : null);

      if (previousFn) {
        previousFn.oneOff = previousFn.oneOff && oneOff;
        return;
      }

      const uid = getUidEvent(originalHandler, originalTypeEvent.replace(namespaceRegex, ''));
      const fn = delegation ? bootstrapDelegationHandler(element, handler, delegationFn) : bootstrapHandler(element, handler);
      fn.delegationSelector = delegation ? handler : null;
      fn.originalHandler = originalHandler;
      fn.oneOff = oneOff;
      fn.uidEvent = uid;
      handlers[uid] = fn;
      element.addEventListener(typeEvent, fn, delegation);
    }

    function removeHandler(element, events, typeEvent, handler, delegationSelector) {
      const fn = findHandler(events[typeEvent], handler, delegationSelector);

      if (!fn) {
        return;
      }

      element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
      delete events[typeEvent][fn.uidEvent];
    }

    function removeNamespacedHandlers(element, events, typeEvent, namespace) {
      const storeElementEvent = events[typeEvent] || {};
      Object.keys(storeElementEvent).forEach(handlerKey => {
        if (handlerKey.includes(namespace)) {
          const event = storeElementEvent[handlerKey];
          removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
        }
      });
    }

    function getTypeEvent(event) {
      // allow to get the native events from namespaced events ('click.bs.button' --> 'click')
      event = event.replace(stripNameRegex, '');
      return customEvents[event] || event;
    }

    const EventHandler = {
      on(element, event, handler, delegationFn) {
        addHandler(element, event, handler, delegationFn, false);
      },

      one(element, event, handler, delegationFn) {
        addHandler(element, event, handler, delegationFn, true);
      },

      off(element, originalTypeEvent, handler, delegationFn) {
        if (typeof originalTypeEvent !== 'string' || !element) {
          return;
        }

        const [delegation, originalHandler, typeEvent] = normalizeParams(originalTypeEvent, handler, delegationFn);
        const inNamespace = typeEvent !== originalTypeEvent;
        const events = getEvent(element);
        const isNamespace = originalTypeEvent.startsWith('.');

        if (typeof originalHandler !== 'undefined') {
          // Simplest case: handler is passed, remove that listener ONLY.
          if (!events || !events[typeEvent]) {
            return;
          }

          removeHandler(element, events, typeEvent, originalHandler, delegation ? handler : null);
          return;
        }

        if (isNamespace) {
          Object.keys(events).forEach(elementEvent => {
            removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
          });
        }

        const storeElementEvent = events[typeEvent] || {};
        Object.keys(storeElementEvent).forEach(keyHandlers => {
          const handlerKey = keyHandlers.replace(stripUidRegex, '');

          if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
            const event = storeElementEvent[keyHandlers];
            removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
          }
        });
      },

      trigger(element, event, args) {
        if (typeof event !== 'string' || !element) {
          return null;
        }

        const $ = getjQuery();
        const typeEvent = getTypeEvent(event);
        const inNamespace = event !== typeEvent;
        const isNative = nativeEvents.has(typeEvent);
        let jQueryEvent;
        let bubbles = true;
        let nativeDispatch = true;
        let defaultPrevented = false;
        let evt = null;

        if (inNamespace && $) {
          jQueryEvent = $.Event(event, args);
          $(element).trigger(jQueryEvent);
          bubbles = !jQueryEvent.isPropagationStopped();
          nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
          defaultPrevented = jQueryEvent.isDefaultPrevented();
        }

        if (isNative) {
          evt = document.createEvent('HTMLEvents');
          evt.initEvent(typeEvent, bubbles, true);
        } else {
          evt = new CustomEvent(event, {
            bubbles,
            cancelable: true
          });
        } // merge custom information in our event


        if (typeof args !== 'undefined') {
          Object.keys(args).forEach(key => {
            Object.defineProperty(evt, key, {
              get() {
                return args[key];
              }

            });
          });
        }

        if (defaultPrevented) {
          evt.preventDefault();
        }

        if (nativeDispatch) {
          element.dispatchEvent(evt);
        }

        if (evt.defaultPrevented && typeof jQueryEvent !== 'undefined') {
          jQueryEvent.preventDefault();
        }

        return evt;
      }

    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): dom/data.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */

    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */
    const elementMap = new Map();
    const Data = {
      set(element, key, instance) {
        if (!elementMap.has(element)) {
          elementMap.set(element, new Map());
        }

        const instanceMap = elementMap.get(element); // make it clear we only want one instance per element
        // can be removed later when multiple key/instances are fine to be used

        if (!instanceMap.has(key) && instanceMap.size !== 0) {
          // eslint-disable-next-line no-console
          console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
          return;
        }

        instanceMap.set(key, instance);
      },

      get(element, key) {
        if (elementMap.has(element)) {
          return elementMap.get(element).get(key) || null;
        }

        return null;
      },

      remove(element, key) {
        if (!elementMap.has(element)) {
          return;
        }

        const instanceMap = elementMap.get(element);
        instanceMap.delete(key); // free up element references if there are no instances left for an element

        if (instanceMap.size === 0) {
          elementMap.delete(element);
        }
      }

    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): base-component.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const VERSION = '5.1.3';

    class BaseComponent {
      constructor(element) {
        element = getElement(element);

        if (!element) {
          return;
        }

        this._element = element;
        Data.set(this._element, this.constructor.DATA_KEY, this);
      }

      dispose() {
        Data.remove(this._element, this.constructor.DATA_KEY);
        EventHandler.off(this._element, this.constructor.EVENT_KEY);
        Object.getOwnPropertyNames(this).forEach(propertyName => {
          this[propertyName] = null;
        });
      }

      _queueCallback(callback, element, isAnimated = true) {
        executeAfterTransition(callback, element, isAnimated);
      }
      /** Static */


      static getInstance(element) {
        return Data.get(getElement(element), this.DATA_KEY);
      }

      static getOrCreateInstance(element, config = {}) {
        return this.getInstance(element) || new this(element, typeof config === 'object' ? config : null);
      }

      static get VERSION() {
        return VERSION;
      }

      static get NAME() {
        throw new Error('You have to implement the static method "NAME", for each component!');
      }

      static get DATA_KEY() {
        return `bs.${this.NAME}`;
      }

      static get EVENT_KEY() {
        return `.${this.DATA_KEY}`;
      }

    }

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/component-functions.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */

    const enableDismissTrigger = (component, method = 'hide') => {
      const clickEvent = `click.dismiss${component.EVENT_KEY}`;
      const name = component.NAME;
      EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function (event) {
        if (['A', 'AREA'].includes(this.tagName)) {
          event.preventDefault();
        }

        if (isDisabled(this)) {
          return;
        }

        const target = getElementFromSelector(this) || this.closest(`.${name}`);
        const instance = component.getOrCreateInstance(target); // Method argument is left, for Alert and only, as it doesn't implement the 'hide' method

        instance[method]();
      });
    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): alert.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$d = 'alert';
    const DATA_KEY$c = 'bs.alert';
    const EVENT_KEY$c = `.${DATA_KEY$c}`;
    const EVENT_CLOSE = `close${EVENT_KEY$c}`;
    const EVENT_CLOSED = `closed${EVENT_KEY$c}`;
    const CLASS_NAME_FADE$5 = 'fade';
    const CLASS_NAME_SHOW$8 = 'show';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Alert extends BaseComponent {
      // Getters
      static get NAME() {
        return NAME$d;
      } // Public


      close() {
        const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);

        if (closeEvent.defaultPrevented) {
          return;
        }

        this._element.classList.remove(CLASS_NAME_SHOW$8);

        const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);

        this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
      } // Private


      _destroyElement() {
        this._element.remove();

        EventHandler.trigger(this._element, EVENT_CLOSED);
        this.dispose();
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Alert.getOrCreateInstance(this);

          if (typeof config !== 'string') {
            return;
          }

          if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config](this);
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    enableDismissTrigger(Alert, 'close');
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Alert to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Alert);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): button.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$c = 'button';
    const DATA_KEY$b = 'bs.button';
    const EVENT_KEY$b = `.${DATA_KEY$b}`;
    const DATA_API_KEY$7 = '.data-api';
    const CLASS_NAME_ACTIVE$3 = 'active';
    const SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
    const EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$b}${DATA_API_KEY$7}`;
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Button extends BaseComponent {
      // Getters
      static get NAME() {
        return NAME$c;
      } // Public


      toggle() {
        // Toggle class and sync the `aria-pressed` attribute with the return value of the `.toggle()` method
        this._element.setAttribute('aria-pressed', this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Button.getOrCreateInstance(this);

          if (config === 'toggle') {
            data[config]();
          }
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, event => {
      event.preventDefault();
      const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
      const data = Button.getOrCreateInstance(button);
      data.toggle();
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Button to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Button);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): dom/manipulator.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    function normalizeData(val) {
      if (val === 'true') {
        return true;
      }

      if (val === 'false') {
        return false;
      }

      if (val === Number(val).toString()) {
        return Number(val);
      }

      if (val === '' || val === 'null') {
        return null;
      }

      return val;
    }

    function normalizeDataKey(key) {
      return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`);
    }

    const Manipulator = {
      setDataAttribute(element, key, value) {
        element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
      },

      removeDataAttribute(element, key) {
        element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
      },

      getDataAttributes(element) {
        if (!element) {
          return {};
        }

        const attributes = {};
        Object.keys(element.dataset).filter(key => key.startsWith('bs')).forEach(key => {
          let pureKey = key.replace(/^bs/, '');
          pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
          attributes[pureKey] = normalizeData(element.dataset[key]);
        });
        return attributes;
      },

      getDataAttribute(element, key) {
        return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
      },

      offset(element) {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top + window.pageYOffset,
          left: rect.left + window.pageXOffset
        };
      },

      position(element) {
        return {
          top: element.offsetTop,
          left: element.offsetLeft
        };
      }

    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): dom/selector-engine.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const NODE_TEXT = 3;
    const SelectorEngine = {
      find(selector, element = document.documentElement) {
        return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
      },

      findOne(selector, element = document.documentElement) {
        return Element.prototype.querySelector.call(element, selector);
      },

      children(element, selector) {
        return [].concat(...element.children).filter(child => child.matches(selector));
      },

      parents(element, selector) {
        const parents = [];
        let ancestor = element.parentNode;

        while (ancestor && ancestor.nodeType === Node.ELEMENT_NODE && ancestor.nodeType !== NODE_TEXT) {
          if (ancestor.matches(selector)) {
            parents.push(ancestor);
          }

          ancestor = ancestor.parentNode;
        }

        return parents;
      },

      prev(element, selector) {
        let previous = element.previousElementSibling;

        while (previous) {
          if (previous.matches(selector)) {
            return [previous];
          }

          previous = previous.previousElementSibling;
        }

        return [];
      },

      next(element, selector) {
        let next = element.nextElementSibling;

        while (next) {
          if (next.matches(selector)) {
            return [next];
          }

          next = next.nextElementSibling;
        }

        return [];
      },

      focusableChildren(element) {
        const focusables = ['a', 'button', 'input', 'textarea', 'select', 'details', '[tabindex]', '[contenteditable="true"]'].map(selector => `${selector}:not([tabindex^="-"])`).join(', ');
        return this.find(focusables, element).filter(el => !isDisabled(el) && isVisible(el));
      }

    };

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): carousel.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$b = 'carousel';
    const DATA_KEY$a = 'bs.carousel';
    const EVENT_KEY$a = `.${DATA_KEY$a}`;
    const DATA_API_KEY$6 = '.data-api';
    const ARROW_LEFT_KEY = 'ArrowLeft';
    const ARROW_RIGHT_KEY = 'ArrowRight';
    const TOUCHEVENT_COMPAT_WAIT = 500; // Time for mouse compat events to fire after touch

    const SWIPE_THRESHOLD = 40;
    const Default$a = {
      interval: 5000,
      keyboard: true,
      slide: false,
      pause: 'hover',
      wrap: true,
      touch: true
    };
    const DefaultType$a = {
      interval: '(number|boolean)',
      keyboard: 'boolean',
      slide: '(boolean|string)',
      pause: '(string|boolean)',
      wrap: 'boolean',
      touch: 'boolean'
    };
    const ORDER_NEXT = 'next';
    const ORDER_PREV = 'prev';
    const DIRECTION_LEFT = 'left';
    const DIRECTION_RIGHT = 'right';
    const KEY_TO_DIRECTION = {
      [ARROW_LEFT_KEY]: DIRECTION_RIGHT,
      [ARROW_RIGHT_KEY]: DIRECTION_LEFT
    };
    const EVENT_SLIDE = `slide${EVENT_KEY$a}`;
    const EVENT_SLID = `slid${EVENT_KEY$a}`;
    const EVENT_KEYDOWN = `keydown${EVENT_KEY$a}`;
    const EVENT_MOUSEENTER = `mouseenter${EVENT_KEY$a}`;
    const EVENT_MOUSELEAVE = `mouseleave${EVENT_KEY$a}`;
    const EVENT_TOUCHSTART = `touchstart${EVENT_KEY$a}`;
    const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$a}`;
    const EVENT_TOUCHEND = `touchend${EVENT_KEY$a}`;
    const EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$a}`;
    const EVENT_POINTERUP = `pointerup${EVENT_KEY$a}`;
    const EVENT_DRAG_START = `dragstart${EVENT_KEY$a}`;
    const EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$a}${DATA_API_KEY$6}`;
    const EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
    const CLASS_NAME_CAROUSEL = 'carousel';
    const CLASS_NAME_ACTIVE$2 = 'active';
    const CLASS_NAME_SLIDE = 'slide';
    const CLASS_NAME_END = 'carousel-item-end';
    const CLASS_NAME_START = 'carousel-item-start';
    const CLASS_NAME_NEXT = 'carousel-item-next';
    const CLASS_NAME_PREV = 'carousel-item-prev';
    const CLASS_NAME_POINTER_EVENT = 'pointer-event';
    const SELECTOR_ACTIVE$1 = '.active';
    const SELECTOR_ACTIVE_ITEM = '.active.carousel-item';
    const SELECTOR_ITEM = '.carousel-item';
    const SELECTOR_ITEM_IMG = '.carousel-item img';
    const SELECTOR_NEXT_PREV = '.carousel-item-next, .carousel-item-prev';
    const SELECTOR_INDICATORS = '.carousel-indicators';
    const SELECTOR_INDICATOR = '[data-bs-target]';
    const SELECTOR_DATA_SLIDE = '[data-bs-slide], [data-bs-slide-to]';
    const SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
    const POINTER_TYPE_TOUCH = 'touch';
    const POINTER_TYPE_PEN = 'pen';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Carousel extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._items = null;
        this._interval = null;
        this._activeElement = null;
        this._isPaused = false;
        this._isSliding = false;
        this.touchTimeout = null;
        this.touchStartX = 0;
        this.touchDeltaX = 0;
        this._config = this._getConfig(config);
        this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
        this._touchSupported = 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0;
        this._pointerEvent = Boolean(window.PointerEvent);

        this._addEventListeners();
      } // Getters


      static get Default() {
        return Default$a;
      }

      static get NAME() {
        return NAME$b;
      } // Public


      next() {
        this._slide(ORDER_NEXT);
      }

      nextWhenVisible() {
        // Don't call next when the page isn't visible
        // or the carousel or its parent isn't visible
        if (!document.hidden && isVisible(this._element)) {
          this.next();
        }
      }

      prev() {
        this._slide(ORDER_PREV);
      }

      pause(event) {
        if (!event) {
          this._isPaused = true;
        }

        if (SelectorEngine.findOne(SELECTOR_NEXT_PREV, this._element)) {
          triggerTransitionEnd(this._element);
          this.cycle(true);
        }

        clearInterval(this._interval);
        this._interval = null;
      }

      cycle(event) {
        if (!event) {
          this._isPaused = false;
        }

        if (this._interval) {
          clearInterval(this._interval);
          this._interval = null;
        }

        if (this._config && this._config.interval && !this._isPaused) {
          this._updateInterval();

          this._interval = setInterval((document.visibilityState ? this.nextWhenVisible : this.next).bind(this), this._config.interval);
        }
      }

      to(index) {
        this._activeElement = SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);

        const activeIndex = this._getItemIndex(this._activeElement);

        if (index > this._items.length - 1 || index < 0) {
          return;
        }

        if (this._isSliding) {
          EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
          return;
        }

        if (activeIndex === index) {
          this.pause();
          this.cycle();
          return;
        }

        const order = index > activeIndex ? ORDER_NEXT : ORDER_PREV;

        this._slide(order, this._items[index]);
      } // Private


      _getConfig(config) {
        config = { ...Default$a,
          ...Manipulator.getDataAttributes(this._element),
          ...(typeof config === 'object' ? config : {})
        };
        typeCheckConfig(NAME$b, config, DefaultType$a);
        return config;
      }

      _handleSwipe() {
        const absDeltax = Math.abs(this.touchDeltaX);

        if (absDeltax <= SWIPE_THRESHOLD) {
          return;
        }

        const direction = absDeltax / this.touchDeltaX;
        this.touchDeltaX = 0;

        if (!direction) {
          return;
        }

        this._slide(direction > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
      }

      _addEventListeners() {
        if (this._config.keyboard) {
          EventHandler.on(this._element, EVENT_KEYDOWN, event => this._keydown(event));
        }

        if (this._config.pause === 'hover') {
          EventHandler.on(this._element, EVENT_MOUSEENTER, event => this.pause(event));
          EventHandler.on(this._element, EVENT_MOUSELEAVE, event => this.cycle(event));
        }

        if (this._config.touch && this._touchSupported) {
          this._addTouchEventListeners();
        }
      }

      _addTouchEventListeners() {
        const hasPointerPenTouch = event => {
          return this._pointerEvent && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
        };

        const start = event => {
          if (hasPointerPenTouch(event)) {
            this.touchStartX = event.clientX;
          } else if (!this._pointerEvent) {
            this.touchStartX = event.touches[0].clientX;
          }
        };

        const move = event => {
          // ensure swiping with one touch and not pinching
          this.touchDeltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this.touchStartX;
        };

        const end = event => {
          if (hasPointerPenTouch(event)) {
            this.touchDeltaX = event.clientX - this.touchStartX;
          }

          this._handleSwipe();

          if (this._config.pause === 'hover') {
            // If it's a touch-enabled device, mouseenter/leave are fired as
            // part of the mouse compatibility events on first tap - the carousel
            // would stop cycling until user tapped out of it;
            // here, we listen for touchend, explicitly pause the carousel
            // (as if it's the second time we tap on it, mouseenter compat event
            // is NOT fired) and after a timeout (to allow for mouse compatibility
            // events to fire) we explicitly restart cycling
            this.pause();

            if (this.touchTimeout) {
              clearTimeout(this.touchTimeout);
            }

            this.touchTimeout = setTimeout(event => this.cycle(event), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
          }
        };

        SelectorEngine.find(SELECTOR_ITEM_IMG, this._element).forEach(itemImg => {
          EventHandler.on(itemImg, EVENT_DRAG_START, event => event.preventDefault());
        });

        if (this._pointerEvent) {
          EventHandler.on(this._element, EVENT_POINTERDOWN, event => start(event));
          EventHandler.on(this._element, EVENT_POINTERUP, event => end(event));

          this._element.classList.add(CLASS_NAME_POINTER_EVENT);
        } else {
          EventHandler.on(this._element, EVENT_TOUCHSTART, event => start(event));
          EventHandler.on(this._element, EVENT_TOUCHMOVE, event => move(event));
          EventHandler.on(this._element, EVENT_TOUCHEND, event => end(event));
        }
      }

      _keydown(event) {
        if (/input|textarea/i.test(event.target.tagName)) {
          return;
        }

        const direction = KEY_TO_DIRECTION[event.key];

        if (direction) {
          event.preventDefault();

          this._slide(direction);
        }
      }

      _getItemIndex(element) {
        this._items = element && element.parentNode ? SelectorEngine.find(SELECTOR_ITEM, element.parentNode) : [];
        return this._items.indexOf(element);
      }

      _getItemByOrder(order, activeElement) {
        const isNext = order === ORDER_NEXT;
        return getNextActiveElement(this._items, activeElement, isNext, this._config.wrap);
      }

      _triggerSlideEvent(relatedTarget, eventDirectionName) {
        const targetIndex = this._getItemIndex(relatedTarget);

        const fromIndex = this._getItemIndex(SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element));

        return EventHandler.trigger(this._element, EVENT_SLIDE, {
          relatedTarget,
          direction: eventDirectionName,
          from: fromIndex,
          to: targetIndex
        });
      }

      _setActiveIndicatorElement(element) {
        if (this._indicatorsElement) {
          const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE$1, this._indicatorsElement);
          activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
          activeIndicator.removeAttribute('aria-current');
          const indicators = SelectorEngine.find(SELECTOR_INDICATOR, this._indicatorsElement);

          for (let i = 0; i < indicators.length; i++) {
            if (Number.parseInt(indicators[i].getAttribute('data-bs-slide-to'), 10) === this._getItemIndex(element)) {
              indicators[i].classList.add(CLASS_NAME_ACTIVE$2);
              indicators[i].setAttribute('aria-current', 'true');
              break;
            }
          }
        }
      }

      _updateInterval() {
        const element = this._activeElement || SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);

        if (!element) {
          return;
        }

        const elementInterval = Number.parseInt(element.getAttribute('data-bs-interval'), 10);

        if (elementInterval) {
          this._config.defaultInterval = this._config.defaultInterval || this._config.interval;
          this._config.interval = elementInterval;
        } else {
          this._config.interval = this._config.defaultInterval || this._config.interval;
        }
      }

      _slide(directionOrOrder, element) {
        const order = this._directionToOrder(directionOrOrder);

        const activeElement = SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);

        const activeElementIndex = this._getItemIndex(activeElement);

        const nextElement = element || this._getItemByOrder(order, activeElement);

        const nextElementIndex = this._getItemIndex(nextElement);

        const isCycling = Boolean(this._interval);
        const isNext = order === ORDER_NEXT;
        const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
        const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;

        const eventDirectionName = this._orderToDirection(order);

        if (nextElement && nextElement.classList.contains(CLASS_NAME_ACTIVE$2)) {
          this._isSliding = false;
          return;
        }

        if (this._isSliding) {
          return;
        }

        const slideEvent = this._triggerSlideEvent(nextElement, eventDirectionName);

        if (slideEvent.defaultPrevented) {
          return;
        }

        if (!activeElement || !nextElement) {
          // Some weirdness is happening, so we bail
          return;
        }

        this._isSliding = true;

        if (isCycling) {
          this.pause();
        }

        this._setActiveIndicatorElement(nextElement);

        this._activeElement = nextElement;

        const triggerSlidEvent = () => {
          EventHandler.trigger(this._element, EVENT_SLID, {
            relatedTarget: nextElement,
            direction: eventDirectionName,
            from: activeElementIndex,
            to: nextElementIndex
          });
        };

        if (this._element.classList.contains(CLASS_NAME_SLIDE)) {
          nextElement.classList.add(orderClassName);
          reflow(nextElement);
          activeElement.classList.add(directionalClassName);
          nextElement.classList.add(directionalClassName);

          const completeCallBack = () => {
            nextElement.classList.remove(directionalClassName, orderClassName);
            nextElement.classList.add(CLASS_NAME_ACTIVE$2);
            activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
            this._isSliding = false;
            setTimeout(triggerSlidEvent, 0);
          };

          this._queueCallback(completeCallBack, activeElement, true);
        } else {
          activeElement.classList.remove(CLASS_NAME_ACTIVE$2);
          nextElement.classList.add(CLASS_NAME_ACTIVE$2);
          this._isSliding = false;
          triggerSlidEvent();
        }

        if (isCycling) {
          this.cycle();
        }
      }

      _directionToOrder(direction) {
        if (![DIRECTION_RIGHT, DIRECTION_LEFT].includes(direction)) {
          return direction;
        }

        if (isRTL()) {
          return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
        }

        return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
      }

      _orderToDirection(order) {
        if (![ORDER_NEXT, ORDER_PREV].includes(order)) {
          return order;
        }

        if (isRTL()) {
          return order === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }

        return order === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
      } // Static


      static carouselInterface(element, config) {
        const data = Carousel.getOrCreateInstance(element, config);
        let {
          _config
        } = data;

        if (typeof config === 'object') {
          _config = { ..._config,
            ...config
          };
        }

        const action = typeof config === 'string' ? config : _config.slide;

        if (typeof config === 'number') {
          data.to(config);
        } else if (typeof action === 'string') {
          if (typeof data[action] === 'undefined') {
            throw new TypeError(`No method named "${action}"`);
          }

          data[action]();
        } else if (_config.interval && _config.ride) {
          data.pause();
          data.cycle();
        }
      }

      static jQueryInterface(config) {
        return this.each(function () {
          Carousel.carouselInterface(this, config);
        });
      }

      static dataApiClickHandler(event) {
        const target = getElementFromSelector(this);

        if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
          return;
        }

        const config = { ...Manipulator.getDataAttributes(target),
          ...Manipulator.getDataAttributes(this)
        };
        const slideIndex = this.getAttribute('data-bs-slide-to');

        if (slideIndex) {
          config.interval = false;
        }

        Carousel.carouselInterface(target, config);

        if (slideIndex) {
          Carousel.getInstance(target).to(slideIndex);
        }

        event.preventDefault();
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, Carousel.dataApiClickHandler);
    EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
      const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);

      for (let i = 0, len = carousels.length; i < len; i++) {
        Carousel.carouselInterface(carousels[i], Carousel.getInstance(carousels[i]));
      }
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Carousel to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Carousel);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): collapse.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$a = 'collapse';
    const DATA_KEY$9 = 'bs.collapse';
    const EVENT_KEY$9 = `.${DATA_KEY$9}`;
    const DATA_API_KEY$5 = '.data-api';
    const Default$9 = {
      toggle: true,
      parent: null
    };
    const DefaultType$9 = {
      toggle: 'boolean',
      parent: '(null|element)'
    };
    const EVENT_SHOW$5 = `show${EVENT_KEY$9}`;
    const EVENT_SHOWN$5 = `shown${EVENT_KEY$9}`;
    const EVENT_HIDE$5 = `hide${EVENT_KEY$9}`;
    const EVENT_HIDDEN$5 = `hidden${EVENT_KEY$9}`;
    const EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$9}${DATA_API_KEY$5}`;
    const CLASS_NAME_SHOW$7 = 'show';
    const CLASS_NAME_COLLAPSE = 'collapse';
    const CLASS_NAME_COLLAPSING = 'collapsing';
    const CLASS_NAME_COLLAPSED = 'collapsed';
    const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
    const CLASS_NAME_HORIZONTAL = 'collapse-horizontal';
    const WIDTH = 'width';
    const HEIGHT = 'height';
    const SELECTOR_ACTIVES = '.collapse.show, .collapse.collapsing';
    const SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Collapse extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._isTransitioning = false;
        this._config = this._getConfig(config);
        this._triggerArray = [];
        const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);

        for (let i = 0, len = toggleList.length; i < len; i++) {
          const elem = toggleList[i];
          const selector = getSelectorFromElement(elem);
          const filterElement = SelectorEngine.find(selector).filter(foundElem => foundElem === this._element);

          if (selector !== null && filterElement.length) {
            this._selector = selector;

            this._triggerArray.push(elem);
          }
        }

        this._initializeChildren();

        if (!this._config.parent) {
          this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
        }

        if (this._config.toggle) {
          this.toggle();
        }
      } // Getters


      static get Default() {
        return Default$9;
      }

      static get NAME() {
        return NAME$a;
      } // Public


      toggle() {
        if (this._isShown()) {
          this.hide();
        } else {
          this.show();
        }
      }

      show() {
        if (this._isTransitioning || this._isShown()) {
          return;
        }

        let actives = [];
        let activesData;

        if (this._config.parent) {
          const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
          actives = SelectorEngine.find(SELECTOR_ACTIVES, this._config.parent).filter(elem => !children.includes(elem)); // remove children if greater depth
        }

        const container = SelectorEngine.findOne(this._selector);

        if (actives.length) {
          const tempActiveData = actives.find(elem => container !== elem);
          activesData = tempActiveData ? Collapse.getInstance(tempActiveData) : null;

          if (activesData && activesData._isTransitioning) {
            return;
          }
        }

        const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$5);

        if (startEvent.defaultPrevented) {
          return;
        }

        actives.forEach(elemActive => {
          if (container !== elemActive) {
            Collapse.getOrCreateInstance(elemActive, {
              toggle: false
            }).hide();
          }

          if (!activesData) {
            Data.set(elemActive, DATA_KEY$9, null);
          }
        });

        const dimension = this._getDimension();

        this._element.classList.remove(CLASS_NAME_COLLAPSE);

        this._element.classList.add(CLASS_NAME_COLLAPSING);

        this._element.style[dimension] = 0;

        this._addAriaAndCollapsedClass(this._triggerArray, true);

        this._isTransitioning = true;

        const complete = () => {
          this._isTransitioning = false;

          this._element.classList.remove(CLASS_NAME_COLLAPSING);

          this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);

          this._element.style[dimension] = '';
          EventHandler.trigger(this._element, EVENT_SHOWN$5);
        };

        const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
        const scrollSize = `scroll${capitalizedDimension}`;

        this._queueCallback(complete, this._element, true);

        this._element.style[dimension] = `${this._element[scrollSize]}px`;
      }

      hide() {
        if (this._isTransitioning || !this._isShown()) {
          return;
        }

        const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$5);

        if (startEvent.defaultPrevented) {
          return;
        }

        const dimension = this._getDimension();

        this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
        reflow(this._element);

        this._element.classList.add(CLASS_NAME_COLLAPSING);

        this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);

        const triggerArrayLength = this._triggerArray.length;

        for (let i = 0; i < triggerArrayLength; i++) {
          const trigger = this._triggerArray[i];
          const elem = getElementFromSelector(trigger);

          if (elem && !this._isShown(elem)) {
            this._addAriaAndCollapsedClass([trigger], false);
          }
        }

        this._isTransitioning = true;

        const complete = () => {
          this._isTransitioning = false;

          this._element.classList.remove(CLASS_NAME_COLLAPSING);

          this._element.classList.add(CLASS_NAME_COLLAPSE);

          EventHandler.trigger(this._element, EVENT_HIDDEN$5);
        };

        this._element.style[dimension] = '';

        this._queueCallback(complete, this._element, true);
      }

      _isShown(element = this._element) {
        return element.classList.contains(CLASS_NAME_SHOW$7);
      } // Private


      _getConfig(config) {
        config = { ...Default$9,
          ...Manipulator.getDataAttributes(this._element),
          ...config
        };
        config.toggle = Boolean(config.toggle); // Coerce string values

        config.parent = getElement(config.parent);
        typeCheckConfig(NAME$a, config, DefaultType$9);
        return config;
      }

      _getDimension() {
        return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
      }

      _initializeChildren() {
        if (!this._config.parent) {
          return;
        }

        const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
        SelectorEngine.find(SELECTOR_DATA_TOGGLE$4, this._config.parent).filter(elem => !children.includes(elem)).forEach(element => {
          const selected = getElementFromSelector(element);

          if (selected) {
            this._addAriaAndCollapsedClass([element], this._isShown(selected));
          }
        });
      }

      _addAriaAndCollapsedClass(triggerArray, isOpen) {
        if (!triggerArray.length) {
          return;
        }

        triggerArray.forEach(elem => {
          if (isOpen) {
            elem.classList.remove(CLASS_NAME_COLLAPSED);
          } else {
            elem.classList.add(CLASS_NAME_COLLAPSED);
          }

          elem.setAttribute('aria-expanded', isOpen);
        });
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const _config = {};

          if (typeof config === 'string' && /show|hide/.test(config)) {
            _config.toggle = false;
          }

          const data = Collapse.getOrCreateInstance(this, _config);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config]();
          }
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function (event) {
      // preventDefault only for <a> elements (which change the URL) not inside the collapsible element
      if (event.target.tagName === 'A' || event.delegateTarget && event.delegateTarget.tagName === 'A') {
        event.preventDefault();
      }

      const selector = getSelectorFromElement(this);
      const selectorElements = SelectorEngine.find(selector);
      selectorElements.forEach(element => {
        Collapse.getOrCreateInstance(element, {
          toggle: false
        }).toggle();
      });
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Collapse to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Collapse);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): dropdown.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$9 = 'dropdown';
    const DATA_KEY$8 = 'bs.dropdown';
    const EVENT_KEY$8 = `.${DATA_KEY$8}`;
    const DATA_API_KEY$4 = '.data-api';
    const ESCAPE_KEY$2 = 'Escape';
    const SPACE_KEY = 'Space';
    const TAB_KEY$1 = 'Tab';
    const ARROW_UP_KEY = 'ArrowUp';
    const ARROW_DOWN_KEY = 'ArrowDown';
    const RIGHT_MOUSE_BUTTON = 2; // MouseEvent.button value for the secondary button, usually the right button

    const REGEXP_KEYDOWN = new RegExp(`${ARROW_UP_KEY}|${ARROW_DOWN_KEY}|${ESCAPE_KEY$2}`);
    const EVENT_HIDE$4 = `hide${EVENT_KEY$8}`;
    const EVENT_HIDDEN$4 = `hidden${EVENT_KEY$8}`;
    const EVENT_SHOW$4 = `show${EVENT_KEY$8}`;
    const EVENT_SHOWN$4 = `shown${EVENT_KEY$8}`;
    const EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$8}${DATA_API_KEY$4}`;
    const CLASS_NAME_SHOW$6 = 'show';
    const CLASS_NAME_DROPUP = 'dropup';
    const CLASS_NAME_DROPEND = 'dropend';
    const CLASS_NAME_DROPSTART = 'dropstart';
    const CLASS_NAME_NAVBAR = 'navbar';
    const SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]';
    const SELECTOR_MENU = '.dropdown-menu';
    const SELECTOR_NAVBAR_NAV = '.navbar-nav';
    const SELECTOR_VISIBLE_ITEMS = '.dropdown-menu .dropdown-item:not(.disabled):not(:disabled)';
    const PLACEMENT_TOP = isRTL() ? 'top-end' : 'top-start';
    const PLACEMENT_TOPEND = isRTL() ? 'top-start' : 'top-end';
    const PLACEMENT_BOTTOM = isRTL() ? 'bottom-end' : 'bottom-start';
    const PLACEMENT_BOTTOMEND = isRTL() ? 'bottom-start' : 'bottom-end';
    const PLACEMENT_RIGHT = isRTL() ? 'left-start' : 'right-start';
    const PLACEMENT_LEFT = isRTL() ? 'right-start' : 'left-start';
    const Default$8 = {
      offset: [0, 2],
      boundary: 'clippingParents',
      reference: 'toggle',
      display: 'dynamic',
      popperConfig: null,
      autoClose: true
    };
    const DefaultType$8 = {
      offset: '(array|string|function)',
      boundary: '(string|element)',
      reference: '(string|element|object)',
      display: 'string',
      popperConfig: '(null|object|function)',
      autoClose: '(boolean|string)'
    };
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Dropdown extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._popper = null;
        this._config = this._getConfig(config);
        this._menu = this._getMenuElement();
        this._inNavbar = this._detectNavbar();
      } // Getters


      static get Default() {
        return Default$8;
      }

      static get DefaultType() {
        return DefaultType$8;
      }

      static get NAME() {
        return NAME$9;
      } // Public


      toggle() {
        return this._isShown() ? this.hide() : this.show();
      }

      show() {
        if (isDisabled(this._element) || this._isShown(this._menu)) {
          return;
        }

        const relatedTarget = {
          relatedTarget: this._element
        };
        const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, relatedTarget);

        if (showEvent.defaultPrevented) {
          return;
        }

        const parent = Dropdown.getParentFromElement(this._element); // Totally disable Popper for Dropdowns in Navbar

        if (this._inNavbar) {
          Manipulator.setDataAttribute(this._menu, 'popper', 'none');
        } else {
          this._createPopper(parent);
        } // If this is a touch-enabled device we add extra
        // empty mouseover listeners to the body's immediate children;
        // only needed because of broken event delegation on iOS
        // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html


        if ('ontouchstart' in document.documentElement && !parent.closest(SELECTOR_NAVBAR_NAV)) {
          [].concat(...document.body.children).forEach(elem => EventHandler.on(elem, 'mouseover', noop));
        }

        this._element.focus();

        this._element.setAttribute('aria-expanded', true);

        this._menu.classList.add(CLASS_NAME_SHOW$6);

        this._element.classList.add(CLASS_NAME_SHOW$6);

        EventHandler.trigger(this._element, EVENT_SHOWN$4, relatedTarget);
      }

      hide() {
        if (isDisabled(this._element) || !this._isShown(this._menu)) {
          return;
        }

        const relatedTarget = {
          relatedTarget: this._element
        };

        this._completeHide(relatedTarget);
      }

      dispose() {
        if (this._popper) {
          this._popper.destroy();
        }

        super.dispose();
      }

      update() {
        this._inNavbar = this._detectNavbar();

        if (this._popper) {
          this._popper.update();
        }
      } // Private


      _completeHide(relatedTarget) {
        const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4, relatedTarget);

        if (hideEvent.defaultPrevented) {
          return;
        } // If this is a touch-enabled device we remove the extra
        // empty mouseover listeners we added for iOS support


        if ('ontouchstart' in document.documentElement) {
          [].concat(...document.body.children).forEach(elem => EventHandler.off(elem, 'mouseover', noop));
        }

        if (this._popper) {
          this._popper.destroy();
        }

        this._menu.classList.remove(CLASS_NAME_SHOW$6);

        this._element.classList.remove(CLASS_NAME_SHOW$6);

        this._element.setAttribute('aria-expanded', 'false');

        Manipulator.removeDataAttribute(this._menu, 'popper');
        EventHandler.trigger(this._element, EVENT_HIDDEN$4, relatedTarget);
      }

      _getConfig(config) {
        config = { ...this.constructor.Default,
          ...Manipulator.getDataAttributes(this._element),
          ...config
        };
        typeCheckConfig(NAME$9, config, this.constructor.DefaultType);

        if (typeof config.reference === 'object' && !isElement(config.reference) && typeof config.reference.getBoundingClientRect !== 'function') {
          // Popper virtual elements require a getBoundingClientRect method
          throw new TypeError(`${NAME$9.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
        }

        return config;
      }

      _createPopper(parent) {
        if (typeof Popper === 'undefined') {
          throw new TypeError('Bootstrap\'s dropdowns require Popper (https://popper.js.org)');
        }

        let referenceElement = this._element;

        if (this._config.reference === 'parent') {
          referenceElement = parent;
        } else if (isElement(this._config.reference)) {
          referenceElement = getElement(this._config.reference);
        } else if (typeof this._config.reference === 'object') {
          referenceElement = this._config.reference;
        }

        const popperConfig = this._getPopperConfig();

        const isDisplayStatic = popperConfig.modifiers.find(modifier => modifier.name === 'applyStyles' && modifier.enabled === false);
        this._popper = createPopper(referenceElement, this._menu, popperConfig);

        if (isDisplayStatic) {
          Manipulator.setDataAttribute(this._menu, 'popper', 'static');
        }
      }

      _isShown(element = this._element) {
        return element.classList.contains(CLASS_NAME_SHOW$6);
      }

      _getMenuElement() {
        return SelectorEngine.next(this._element, SELECTOR_MENU)[0];
      }

      _getPlacement() {
        const parentDropdown = this._element.parentNode;

        if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
          return PLACEMENT_RIGHT;
        }

        if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
          return PLACEMENT_LEFT;
        } // We need to trim the value because custom properties can also include spaces


        const isEnd = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';

        if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
          return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
        }

        return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
      }

      _detectNavbar() {
        return this._element.closest(`.${CLASS_NAME_NAVBAR}`) !== null;
      }

      _getOffset() {
        const {
          offset
        } = this._config;

        if (typeof offset === 'string') {
          return offset.split(',').map(val => Number.parseInt(val, 10));
        }

        if (typeof offset === 'function') {
          return popperData => offset(popperData, this._element);
        }

        return offset;
      }

      _getPopperConfig() {
        const defaultBsPopperConfig = {
          placement: this._getPlacement(),
          modifiers: [{
            name: 'preventOverflow',
            options: {
              boundary: this._config.boundary
            }
          }, {
            name: 'offset',
            options: {
              offset: this._getOffset()
            }
          }]
        }; // Disable Popper if we have a static display

        if (this._config.display === 'static') {
          defaultBsPopperConfig.modifiers = [{
            name: 'applyStyles',
            enabled: false
          }];
        }

        return { ...defaultBsPopperConfig,
          ...(typeof this._config.popperConfig === 'function' ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig)
        };
      }

      _selectMenuItem({
        key,
        target
      }) {
        const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(isVisible);

        if (!items.length) {
          return;
        } // if target isn't included in items (e.g. when expanding the dropdown)
        // allow cycling to get the last item in case key equals ARROW_UP_KEY


        getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Dropdown.getOrCreateInstance(this, config);

          if (typeof config !== 'string') {
            return;
          }

          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config]();
        });
      }

      static clearMenus(event) {
        if (event && (event.button === RIGHT_MOUSE_BUTTON || event.type === 'keyup' && event.key !== TAB_KEY$1)) {
          return;
        }

        const toggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE$3);

        for (let i = 0, len = toggles.length; i < len; i++) {
          const context = Dropdown.getInstance(toggles[i]);

          if (!context || context._config.autoClose === false) {
            continue;
          }

          if (!context._isShown()) {
            continue;
          }

          const relatedTarget = {
            relatedTarget: context._element
          };

          if (event) {
            const composedPath = event.composedPath();
            const isMenuTarget = composedPath.includes(context._menu);

            if (composedPath.includes(context._element) || context._config.autoClose === 'inside' && !isMenuTarget || context._config.autoClose === 'outside' && isMenuTarget) {
              continue;
            } // Tab navigation through the dropdown menu or events from contained inputs shouldn't close the menu


            if (context._menu.contains(event.target) && (event.type === 'keyup' && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
              continue;
            }

            if (event.type === 'click') {
              relatedTarget.clickEvent = event;
            }
          }

          context._completeHide(relatedTarget);
        }
      }

      static getParentFromElement(element) {
        return getElementFromSelector(element) || element.parentNode;
      }

      static dataApiKeydownHandler(event) {
        // If not input/textarea:
        //  - And not a key in REGEXP_KEYDOWN => not a dropdown command
        // If input/textarea:
        //  - If space key => not a dropdown command
        //  - If key is other than escape
        //    - If key is not up or down => not a dropdown command
        //    - If trigger inside the menu => not a dropdown command
        if (/input|textarea/i.test(event.target.tagName) ? event.key === SPACE_KEY || event.key !== ESCAPE_KEY$2 && (event.key !== ARROW_DOWN_KEY && event.key !== ARROW_UP_KEY || event.target.closest(SELECTOR_MENU)) : !REGEXP_KEYDOWN.test(event.key)) {
          return;
        }

        const isActive = this.classList.contains(CLASS_NAME_SHOW$6);

        if (!isActive && event.key === ESCAPE_KEY$2) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (isDisabled(this)) {
          return;
        }

        const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0];
        const instance = Dropdown.getOrCreateInstance(getToggleButton);

        if (event.key === ESCAPE_KEY$2) {
          instance.hide();
          return;
        }

        if (event.key === ARROW_UP_KEY || event.key === ARROW_DOWN_KEY) {
          if (!isActive) {
            instance.show();
          }

          instance._selectMenuItem(event);

          return;
        }

        if (!isActive || event.key === SPACE_KEY) {
          Dropdown.clearMenus();
        }
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
    EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
    EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
    EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
    EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function (event) {
      event.preventDefault();
      Dropdown.getOrCreateInstance(this).toggle();
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Dropdown to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Dropdown);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/scrollBar.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const SELECTOR_FIXED_CONTENT = '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top';
    const SELECTOR_STICKY_CONTENT = '.sticky-top';

    class ScrollBarHelper {
      constructor() {
        this._element = document.body;
      }

      getWidth() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth#usage_notes
        const documentWidth = document.documentElement.clientWidth;
        return Math.abs(window.innerWidth - documentWidth);
      }

      hide() {
        const width = this.getWidth();

        this._disableOverFlow(); // give padding to element to balance the hidden scrollbar width


        this._setElementAttributes(this._element, 'paddingRight', calculatedValue => calculatedValue + width); // trick: We adjust positive paddingRight and negative marginRight to sticky-top elements to keep showing fullwidth


        this._setElementAttributes(SELECTOR_FIXED_CONTENT, 'paddingRight', calculatedValue => calculatedValue + width);

        this._setElementAttributes(SELECTOR_STICKY_CONTENT, 'marginRight', calculatedValue => calculatedValue - width);
      }

      _disableOverFlow() {
        this._saveInitialAttribute(this._element, 'overflow');

        this._element.style.overflow = 'hidden';
      }

      _setElementAttributes(selector, styleProp, callback) {
        const scrollbarWidth = this.getWidth();

        const manipulationCallBack = element => {
          if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
            return;
          }

          this._saveInitialAttribute(element, styleProp);

          const calculatedValue = window.getComputedStyle(element)[styleProp];
          element.style[styleProp] = `${callback(Number.parseFloat(calculatedValue))}px`;
        };

        this._applyManipulationCallback(selector, manipulationCallBack);
      }

      reset() {
        this._resetElementAttributes(this._element, 'overflow');

        this._resetElementAttributes(this._element, 'paddingRight');

        this._resetElementAttributes(SELECTOR_FIXED_CONTENT, 'paddingRight');

        this._resetElementAttributes(SELECTOR_STICKY_CONTENT, 'marginRight');
      }

      _saveInitialAttribute(element, styleProp) {
        const actualValue = element.style[styleProp];

        if (actualValue) {
          Manipulator.setDataAttribute(element, styleProp, actualValue);
        }
      }

      _resetElementAttributes(selector, styleProp) {
        const manipulationCallBack = element => {
          const value = Manipulator.getDataAttribute(element, styleProp);

          if (typeof value === 'undefined') {
            element.style.removeProperty(styleProp);
          } else {
            Manipulator.removeDataAttribute(element, styleProp);
            element.style[styleProp] = value;
          }
        };

        this._applyManipulationCallback(selector, manipulationCallBack);
      }

      _applyManipulationCallback(selector, callBack) {
        if (isElement(selector)) {
          callBack(selector);
        } else {
          SelectorEngine.find(selector, this._element).forEach(callBack);
        }
      }

      isOverflowing() {
        return this.getWidth() > 0;
      }

    }

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/backdrop.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const Default$7 = {
      className: 'modal-backdrop',
      isVisible: true,
      // if false, we use the backdrop helper without adding any element to the dom
      isAnimated: false,
      rootElement: 'body',
      // give the choice to place backdrop under different elements
      clickCallback: null
    };
    const DefaultType$7 = {
      className: 'string',
      isVisible: 'boolean',
      isAnimated: 'boolean',
      rootElement: '(element|string)',
      clickCallback: '(function|null)'
    };
    const NAME$8 = 'backdrop';
    const CLASS_NAME_FADE$4 = 'fade';
    const CLASS_NAME_SHOW$5 = 'show';
    const EVENT_MOUSEDOWN = `mousedown.bs.${NAME$8}`;

    class Backdrop {
      constructor(config) {
        this._config = this._getConfig(config);
        this._isAppended = false;
        this._element = null;
      }

      show(callback) {
        if (!this._config.isVisible) {
          execute(callback);
          return;
        }

        this._append();

        if (this._config.isAnimated) {
          reflow(this._getElement());
        }

        this._getElement().classList.add(CLASS_NAME_SHOW$5);

        this._emulateAnimation(() => {
          execute(callback);
        });
      }

      hide(callback) {
        if (!this._config.isVisible) {
          execute(callback);
          return;
        }

        this._getElement().classList.remove(CLASS_NAME_SHOW$5);

        this._emulateAnimation(() => {
          this.dispose();
          execute(callback);
        });
      } // Private


      _getElement() {
        if (!this._element) {
          const backdrop = document.createElement('div');
          backdrop.className = this._config.className;

          if (this._config.isAnimated) {
            backdrop.classList.add(CLASS_NAME_FADE$4);
          }

          this._element = backdrop;
        }

        return this._element;
      }

      _getConfig(config) {
        config = { ...Default$7,
          ...(typeof config === 'object' ? config : {})
        }; // use getElement() with the default "body" to get a fresh Element on each instantiation

        config.rootElement = getElement(config.rootElement);
        typeCheckConfig(NAME$8, config, DefaultType$7);
        return config;
      }

      _append() {
        if (this._isAppended) {
          return;
        }

        this._config.rootElement.append(this._getElement());

        EventHandler.on(this._getElement(), EVENT_MOUSEDOWN, () => {
          execute(this._config.clickCallback);
        });
        this._isAppended = true;
      }

      dispose() {
        if (!this._isAppended) {
          return;
        }

        EventHandler.off(this._element, EVENT_MOUSEDOWN);

        this._element.remove();

        this._isAppended = false;
      }

      _emulateAnimation(callback) {
        executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
      }

    }

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/focustrap.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const Default$6 = {
      trapElement: null,
      // The element to trap focus inside of
      autofocus: true
    };
    const DefaultType$6 = {
      trapElement: 'element',
      autofocus: 'boolean'
    };
    const NAME$7 = 'focustrap';
    const DATA_KEY$7 = 'bs.focustrap';
    const EVENT_KEY$7 = `.${DATA_KEY$7}`;
    const EVENT_FOCUSIN$1 = `focusin${EVENT_KEY$7}`;
    const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$7}`;
    const TAB_KEY = 'Tab';
    const TAB_NAV_FORWARD = 'forward';
    const TAB_NAV_BACKWARD = 'backward';

    class FocusTrap {
      constructor(config) {
        this._config = this._getConfig(config);
        this._isActive = false;
        this._lastTabNavDirection = null;
      }

      activate() {
        const {
          trapElement,
          autofocus
        } = this._config;

        if (this._isActive) {
          return;
        }

        if (autofocus) {
          trapElement.focus();
        }

        EventHandler.off(document, EVENT_KEY$7); // guard against infinite focus loop

        EventHandler.on(document, EVENT_FOCUSIN$1, event => this._handleFocusin(event));
        EventHandler.on(document, EVENT_KEYDOWN_TAB, event => this._handleKeydown(event));
        this._isActive = true;
      }

      deactivate() {
        if (!this._isActive) {
          return;
        }

        this._isActive = false;
        EventHandler.off(document, EVENT_KEY$7);
      } // Private


      _handleFocusin(event) {
        const {
          target
        } = event;
        const {
          trapElement
        } = this._config;

        if (target === document || target === trapElement || trapElement.contains(target)) {
          return;
        }

        const elements = SelectorEngine.focusableChildren(trapElement);

        if (elements.length === 0) {
          trapElement.focus();
        } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
          elements[elements.length - 1].focus();
        } else {
          elements[0].focus();
        }
      }

      _handleKeydown(event) {
        if (event.key !== TAB_KEY) {
          return;
        }

        this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
      }

      _getConfig(config) {
        config = { ...Default$6,
          ...(typeof config === 'object' ? config : {})
        };
        typeCheckConfig(NAME$7, config, DefaultType$6);
        return config;
      }

    }

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): modal.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$6 = 'modal';
    const DATA_KEY$6 = 'bs.modal';
    const EVENT_KEY$6 = `.${DATA_KEY$6}`;
    const DATA_API_KEY$3 = '.data-api';
    const ESCAPE_KEY$1 = 'Escape';
    const Default$5 = {
      backdrop: true,
      keyboard: true,
      focus: true
    };
    const DefaultType$5 = {
      backdrop: '(boolean|string)',
      keyboard: 'boolean',
      focus: 'boolean'
    };
    const EVENT_HIDE$3 = `hide${EVENT_KEY$6}`;
    const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$6}`;
    const EVENT_HIDDEN$3 = `hidden${EVENT_KEY$6}`;
    const EVENT_SHOW$3 = `show${EVENT_KEY$6}`;
    const EVENT_SHOWN$3 = `shown${EVENT_KEY$6}`;
    const EVENT_RESIZE = `resize${EVENT_KEY$6}`;
    const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$6}`;
    const EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$6}`;
    const EVENT_MOUSEUP_DISMISS = `mouseup.dismiss${EVENT_KEY$6}`;
    const EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$6}`;
    const EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
    const CLASS_NAME_OPEN = 'modal-open';
    const CLASS_NAME_FADE$3 = 'fade';
    const CLASS_NAME_SHOW$4 = 'show';
    const CLASS_NAME_STATIC = 'modal-static';
    const OPEN_SELECTOR$1 = '.modal.show';
    const SELECTOR_DIALOG = '.modal-dialog';
    const SELECTOR_MODAL_BODY = '.modal-body';
    const SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Modal extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._config = this._getConfig(config);
        this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
        this._backdrop = this._initializeBackDrop();
        this._focustrap = this._initializeFocusTrap();
        this._isShown = false;
        this._ignoreBackdropClick = false;
        this._isTransitioning = false;
        this._scrollBar = new ScrollBarHelper();
      } // Getters


      static get Default() {
        return Default$5;
      }

      static get NAME() {
        return NAME$6;
      } // Public


      toggle(relatedTarget) {
        return this._isShown ? this.hide() : this.show(relatedTarget);
      }

      show(relatedTarget) {
        if (this._isShown || this._isTransitioning) {
          return;
        }

        const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
          relatedTarget
        });

        if (showEvent.defaultPrevented) {
          return;
        }

        this._isShown = true;

        if (this._isAnimated()) {
          this._isTransitioning = true;
        }

        this._scrollBar.hide();

        document.body.classList.add(CLASS_NAME_OPEN);

        this._adjustDialog();

        this._setEscapeEvent();

        this._setResizeEvent();

        EventHandler.on(this._dialog, EVENT_MOUSEDOWN_DISMISS, () => {
          EventHandler.one(this._element, EVENT_MOUSEUP_DISMISS, event => {
            if (event.target === this._element) {
              this._ignoreBackdropClick = true;
            }
          });
        });

        this._showBackdrop(() => this._showElement(relatedTarget));
      }

      hide() {
        if (!this._isShown || this._isTransitioning) {
          return;
        }

        const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);

        if (hideEvent.defaultPrevented) {
          return;
        }

        this._isShown = false;

        const isAnimated = this._isAnimated();

        if (isAnimated) {
          this._isTransitioning = true;
        }

        this._setEscapeEvent();

        this._setResizeEvent();

        this._focustrap.deactivate();

        this._element.classList.remove(CLASS_NAME_SHOW$4);

        EventHandler.off(this._element, EVENT_CLICK_DISMISS);
        EventHandler.off(this._dialog, EVENT_MOUSEDOWN_DISMISS);

        this._queueCallback(() => this._hideModal(), this._element, isAnimated);
      }

      dispose() {
        [window, this._dialog].forEach(htmlElement => EventHandler.off(htmlElement, EVENT_KEY$6));

        this._backdrop.dispose();

        this._focustrap.deactivate();

        super.dispose();
      }

      handleUpdate() {
        this._adjustDialog();
      } // Private


      _initializeBackDrop() {
        return new Backdrop({
          isVisible: Boolean(this._config.backdrop),
          // 'static' option will be translated to true, and booleans will keep their value
          isAnimated: this._isAnimated()
        });
      }

      _initializeFocusTrap() {
        return new FocusTrap({
          trapElement: this._element
        });
      }

      _getConfig(config) {
        config = { ...Default$5,
          ...Manipulator.getDataAttributes(this._element),
          ...(typeof config === 'object' ? config : {})
        };
        typeCheckConfig(NAME$6, config, DefaultType$5);
        return config;
      }

      _showElement(relatedTarget) {
        const isAnimated = this._isAnimated();

        const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);

        if (!this._element.parentNode || this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
          // Don't move modal's DOM position
          document.body.append(this._element);
        }

        this._element.style.display = 'block';

        this._element.removeAttribute('aria-hidden');

        this._element.setAttribute('aria-modal', true);

        this._element.setAttribute('role', 'dialog');

        this._element.scrollTop = 0;

        if (modalBody) {
          modalBody.scrollTop = 0;
        }

        if (isAnimated) {
          reflow(this._element);
        }

        this._element.classList.add(CLASS_NAME_SHOW$4);

        const transitionComplete = () => {
          if (this._config.focus) {
            this._focustrap.activate();
          }

          this._isTransitioning = false;
          EventHandler.trigger(this._element, EVENT_SHOWN$3, {
            relatedTarget
          });
        };

        this._queueCallback(transitionComplete, this._dialog, isAnimated);
      }

      _setEscapeEvent() {
        if (this._isShown) {
          EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, event => {
            if (this._config.keyboard && event.key === ESCAPE_KEY$1) {
              event.preventDefault();
              this.hide();
            } else if (!this._config.keyboard && event.key === ESCAPE_KEY$1) {
              this._triggerBackdropTransition();
            }
          });
        } else {
          EventHandler.off(this._element, EVENT_KEYDOWN_DISMISS$1);
        }
      }

      _setResizeEvent() {
        if (this._isShown) {
          EventHandler.on(window, EVENT_RESIZE, () => this._adjustDialog());
        } else {
          EventHandler.off(window, EVENT_RESIZE);
        }
      }

      _hideModal() {
        this._element.style.display = 'none';

        this._element.setAttribute('aria-hidden', true);

        this._element.removeAttribute('aria-modal');

        this._element.removeAttribute('role');

        this._isTransitioning = false;

        this._backdrop.hide(() => {
          document.body.classList.remove(CLASS_NAME_OPEN);

          this._resetAdjustments();

          this._scrollBar.reset();

          EventHandler.trigger(this._element, EVENT_HIDDEN$3);
        });
      }

      _showBackdrop(callback) {
        EventHandler.on(this._element, EVENT_CLICK_DISMISS, event => {
          if (this._ignoreBackdropClick) {
            this._ignoreBackdropClick = false;
            return;
          }

          if (event.target !== event.currentTarget) {
            return;
          }

          if (this._config.backdrop === true) {
            this.hide();
          } else if (this._config.backdrop === 'static') {
            this._triggerBackdropTransition();
          }
        });

        this._backdrop.show(callback);
      }

      _isAnimated() {
        return this._element.classList.contains(CLASS_NAME_FADE$3);
      }

      _triggerBackdropTransition() {
        const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);

        if (hideEvent.defaultPrevented) {
          return;
        }

        const {
          classList,
          scrollHeight,
          style
        } = this._element;
        const isModalOverflowing = scrollHeight > document.documentElement.clientHeight; // return if the following background transition hasn't yet completed

        if (!isModalOverflowing && style.overflowY === 'hidden' || classList.contains(CLASS_NAME_STATIC)) {
          return;
        }

        if (!isModalOverflowing) {
          style.overflowY = 'hidden';
        }

        classList.add(CLASS_NAME_STATIC);

        this._queueCallback(() => {
          classList.remove(CLASS_NAME_STATIC);

          if (!isModalOverflowing) {
            this._queueCallback(() => {
              style.overflowY = '';
            }, this._dialog);
          }
        }, this._dialog);

        this._element.focus();
      } // ----------------------------------------------------------------------
      // the following methods are used to handle overflowing modals
      // ----------------------------------------------------------------------


      _adjustDialog() {
        const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;

        const scrollbarWidth = this._scrollBar.getWidth();

        const isBodyOverflowing = scrollbarWidth > 0;

        if (!isBodyOverflowing && isModalOverflowing && !isRTL() || isBodyOverflowing && !isModalOverflowing && isRTL()) {
          this._element.style.paddingLeft = `${scrollbarWidth}px`;
        }

        if (isBodyOverflowing && !isModalOverflowing && !isRTL() || !isBodyOverflowing && isModalOverflowing && isRTL()) {
          this._element.style.paddingRight = `${scrollbarWidth}px`;
        }
      }

      _resetAdjustments() {
        this._element.style.paddingLeft = '';
        this._element.style.paddingRight = '';
      } // Static


      static jQueryInterface(config, relatedTarget) {
        return this.each(function () {
          const data = Modal.getOrCreateInstance(this, config);

          if (typeof config !== 'string') {
            return;
          }

          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config](relatedTarget);
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function (event) {
      const target = getElementFromSelector(this);

      if (['A', 'AREA'].includes(this.tagName)) {
        event.preventDefault();
      }

      EventHandler.one(target, EVENT_SHOW$3, showEvent => {
        if (showEvent.defaultPrevented) {
          // only register focus restorer if modal will actually get shown
          return;
        }

        EventHandler.one(target, EVENT_HIDDEN$3, () => {
          if (isVisible(this)) {
            this.focus();
          }
        });
      }); // avoid conflict when clicking moddal toggler while another one is open

      const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);

      if (allReadyOpen) {
        Modal.getInstance(allReadyOpen).hide();
      }

      const data = Modal.getOrCreateInstance(target);
      data.toggle(this);
    });
    enableDismissTrigger(Modal);
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Modal to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Modal);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): offcanvas.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$5 = 'offcanvas';
    const DATA_KEY$5 = 'bs.offcanvas';
    const EVENT_KEY$5 = `.${DATA_KEY$5}`;
    const DATA_API_KEY$2 = '.data-api';
    const EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$5}${DATA_API_KEY$2}`;
    const ESCAPE_KEY = 'Escape';
    const Default$4 = {
      backdrop: true,
      keyboard: true,
      scroll: false
    };
    const DefaultType$4 = {
      backdrop: 'boolean',
      keyboard: 'boolean',
      scroll: 'boolean'
    };
    const CLASS_NAME_SHOW$3 = 'show';
    const CLASS_NAME_BACKDROP = 'offcanvas-backdrop';
    const OPEN_SELECTOR = '.offcanvas.show';
    const EVENT_SHOW$2 = `show${EVENT_KEY$5}`;
    const EVENT_SHOWN$2 = `shown${EVENT_KEY$5}`;
    const EVENT_HIDE$2 = `hide${EVENT_KEY$5}`;
    const EVENT_HIDDEN$2 = `hidden${EVENT_KEY$5}`;
    const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$5}${DATA_API_KEY$2}`;
    const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$5}`;
    const SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Offcanvas extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._config = this._getConfig(config);
        this._isShown = false;
        this._backdrop = this._initializeBackDrop();
        this._focustrap = this._initializeFocusTrap();

        this._addEventListeners();
      } // Getters


      static get NAME() {
        return NAME$5;
      }

      static get Default() {
        return Default$4;
      } // Public


      toggle(relatedTarget) {
        return this._isShown ? this.hide() : this.show(relatedTarget);
      }

      show(relatedTarget) {
        if (this._isShown) {
          return;
        }

        const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$2, {
          relatedTarget
        });

        if (showEvent.defaultPrevented) {
          return;
        }

        this._isShown = true;
        this._element.style.visibility = 'visible';

        this._backdrop.show();

        if (!this._config.scroll) {
          new ScrollBarHelper().hide();
        }

        this._element.removeAttribute('aria-hidden');

        this._element.setAttribute('aria-modal', true);

        this._element.setAttribute('role', 'dialog');

        this._element.classList.add(CLASS_NAME_SHOW$3);

        const completeCallBack = () => {
          if (!this._config.scroll) {
            this._focustrap.activate();
          }

          EventHandler.trigger(this._element, EVENT_SHOWN$2, {
            relatedTarget
          });
        };

        this._queueCallback(completeCallBack, this._element, true);
      }

      hide() {
        if (!this._isShown) {
          return;
        }

        const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$2);

        if (hideEvent.defaultPrevented) {
          return;
        }

        this._focustrap.deactivate();

        this._element.blur();

        this._isShown = false;

        this._element.classList.remove(CLASS_NAME_SHOW$3);

        this._backdrop.hide();

        const completeCallback = () => {
          this._element.setAttribute('aria-hidden', true);

          this._element.removeAttribute('aria-modal');

          this._element.removeAttribute('role');

          this._element.style.visibility = 'hidden';

          if (!this._config.scroll) {
            new ScrollBarHelper().reset();
          }

          EventHandler.trigger(this._element, EVENT_HIDDEN$2);
        };

        this._queueCallback(completeCallback, this._element, true);
      }

      dispose() {
        this._backdrop.dispose();

        this._focustrap.deactivate();

        super.dispose();
      } // Private


      _getConfig(config) {
        config = { ...Default$4,
          ...Manipulator.getDataAttributes(this._element),
          ...(typeof config === 'object' ? config : {})
        };
        typeCheckConfig(NAME$5, config, DefaultType$4);
        return config;
      }

      _initializeBackDrop() {
        return new Backdrop({
          className: CLASS_NAME_BACKDROP,
          isVisible: this._config.backdrop,
          isAnimated: true,
          rootElement: this._element.parentNode,
          clickCallback: () => this.hide()
        });
      }

      _initializeFocusTrap() {
        return new FocusTrap({
          trapElement: this._element
        });
      }

      _addEventListeners() {
        EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, event => {
          if (this._config.keyboard && event.key === ESCAPE_KEY) {
            this.hide();
          }
        });
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Offcanvas.getOrCreateInstance(this, config);

          if (typeof config !== 'string') {
            return;
          }

          if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config](this);
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function (event) {
      const target = getElementFromSelector(this);

      if (['A', 'AREA'].includes(this.tagName)) {
        event.preventDefault();
      }

      if (isDisabled(this)) {
        return;
      }

      EventHandler.one(target, EVENT_HIDDEN$2, () => {
        // focus on trigger when it is closed
        if (isVisible(this)) {
          this.focus();
        }
      }); // avoid conflict when clicking a toggler of an offcanvas, while another is open

      const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);

      if (allReadyOpen && allReadyOpen !== target) {
        Offcanvas.getInstance(allReadyOpen).hide();
      }

      const data = Offcanvas.getOrCreateInstance(target);
      data.toggle(this);
    });
    EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => SelectorEngine.find(OPEN_SELECTOR).forEach(el => Offcanvas.getOrCreateInstance(el).show()));
    enableDismissTrigger(Offcanvas);
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     */

    defineJQueryPlugin(Offcanvas);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): util/sanitizer.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    const uriAttributes = new Set(['background', 'cite', 'href', 'itemtype', 'longdesc', 'poster', 'src', 'xlink:href']);
    const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
    /**
     * A pattern that recognizes a commonly useful subset of URLs that are safe.
     *
     * Shoutout to Angular https://github.com/angular/angular/blob/12.2.x/packages/core/src/sanitization/url_sanitizer.ts
     */

    const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^#&/:?]*(?:[#/?]|$))/i;
    /**
     * A pattern that matches safe data URLs. Only matches image, video and audio types.
     *
     * Shoutout to Angular https://github.com/angular/angular/blob/12.2.x/packages/core/src/sanitization/url_sanitizer.ts
     */

    const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i;

    const allowedAttribute = (attribute, allowedAttributeList) => {
      const attributeName = attribute.nodeName.toLowerCase();

      if (allowedAttributeList.includes(attributeName)) {
        if (uriAttributes.has(attributeName)) {
          return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue) || DATA_URL_PATTERN.test(attribute.nodeValue));
        }

        return true;
      }

      const regExp = allowedAttributeList.filter(attributeRegex => attributeRegex instanceof RegExp); // Check if a regular expression validates the attribute.

      for (let i = 0, len = regExp.length; i < len; i++) {
        if (regExp[i].test(attributeName)) {
          return true;
        }
      }

      return false;
    };

    const DefaultAllowlist = {
      // Global attributes allowed on any supplied element below.
      '*': ['class', 'dir', 'id', 'lang', 'role', ARIA_ATTRIBUTE_PATTERN],
      a: ['target', 'href', 'title', 'rel'],
      area: [],
      b: [],
      br: [],
      col: [],
      code: [],
      div: [],
      em: [],
      hr: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      i: [],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
      li: [],
      ol: [],
      p: [],
      pre: [],
      s: [],
      small: [],
      span: [],
      sub: [],
      sup: [],
      strong: [],
      u: [],
      ul: []
    };
    function sanitizeHtml(unsafeHtml, allowList, sanitizeFn) {
      if (!unsafeHtml.length) {
        return unsafeHtml;
      }

      if (sanitizeFn && typeof sanitizeFn === 'function') {
        return sanitizeFn(unsafeHtml);
      }

      const domParser = new window.DOMParser();
      const createdDocument = domParser.parseFromString(unsafeHtml, 'text/html');
      const elements = [].concat(...createdDocument.body.querySelectorAll('*'));

      for (let i = 0, len = elements.length; i < len; i++) {
        const element = elements[i];
        const elementName = element.nodeName.toLowerCase();

        if (!Object.keys(allowList).includes(elementName)) {
          element.remove();
          continue;
        }

        const attributeList = [].concat(...element.attributes);
        const allowedAttributes = [].concat(allowList['*'] || [], allowList[elementName] || []);
        attributeList.forEach(attribute => {
          if (!allowedAttribute(attribute, allowedAttributes)) {
            element.removeAttribute(attribute.nodeName);
          }
        });
      }

      return createdDocument.body.innerHTML;
    }

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): tooltip.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$4 = 'tooltip';
    const DATA_KEY$4 = 'bs.tooltip';
    const EVENT_KEY$4 = `.${DATA_KEY$4}`;
    const CLASS_PREFIX$1 = 'bs-tooltip';
    const DISALLOWED_ATTRIBUTES = new Set(['sanitize', 'allowList', 'sanitizeFn']);
    const DefaultType$3 = {
      animation: 'boolean',
      template: 'string',
      title: '(string|element|function)',
      trigger: 'string',
      delay: '(number|object)',
      html: 'boolean',
      selector: '(string|boolean)',
      placement: '(string|function)',
      offset: '(array|string|function)',
      container: '(string|element|boolean)',
      fallbackPlacements: 'array',
      boundary: '(string|element)',
      customClass: '(string|function)',
      sanitize: 'boolean',
      sanitizeFn: '(null|function)',
      allowList: 'object',
      popperConfig: '(null|object|function)'
    };
    const AttachmentMap = {
      AUTO: 'auto',
      TOP: 'top',
      RIGHT: isRTL() ? 'left' : 'right',
      BOTTOM: 'bottom',
      LEFT: isRTL() ? 'right' : 'left'
    };
    const Default$3 = {
      animation: true,
      template: '<div class="tooltip" role="tooltip">' + '<div class="tooltip-arrow"></div>' + '<div class="tooltip-inner"></div>' + '</div>',
      trigger: 'hover focus',
      title: '',
      delay: 0,
      html: false,
      selector: false,
      placement: 'top',
      offset: [0, 0],
      container: false,
      fallbackPlacements: ['top', 'right', 'bottom', 'left'],
      boundary: 'clippingParents',
      customClass: '',
      sanitize: true,
      sanitizeFn: null,
      allowList: DefaultAllowlist,
      popperConfig: null
    };
    const Event$2 = {
      HIDE: `hide${EVENT_KEY$4}`,
      HIDDEN: `hidden${EVENT_KEY$4}`,
      SHOW: `show${EVENT_KEY$4}`,
      SHOWN: `shown${EVENT_KEY$4}`,
      INSERTED: `inserted${EVENT_KEY$4}`,
      CLICK: `click${EVENT_KEY$4}`,
      FOCUSIN: `focusin${EVENT_KEY$4}`,
      FOCUSOUT: `focusout${EVENT_KEY$4}`,
      MOUSEENTER: `mouseenter${EVENT_KEY$4}`,
      MOUSELEAVE: `mouseleave${EVENT_KEY$4}`
    };
    const CLASS_NAME_FADE$2 = 'fade';
    const CLASS_NAME_MODAL = 'modal';
    const CLASS_NAME_SHOW$2 = 'show';
    const HOVER_STATE_SHOW = 'show';
    const HOVER_STATE_OUT = 'out';
    const SELECTOR_TOOLTIP_INNER = '.tooltip-inner';
    const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
    const EVENT_MODAL_HIDE = 'hide.bs.modal';
    const TRIGGER_HOVER = 'hover';
    const TRIGGER_FOCUS = 'focus';
    const TRIGGER_CLICK = 'click';
    const TRIGGER_MANUAL = 'manual';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Tooltip extends BaseComponent {
      constructor(element, config) {
        if (typeof Popper === 'undefined') {
          throw new TypeError('Bootstrap\'s tooltips require Popper (https://popper.js.org)');
        }

        super(element); // private

        this._isEnabled = true;
        this._timeout = 0;
        this._hoverState = '';
        this._activeTrigger = {};
        this._popper = null; // Protected

        this._config = this._getConfig(config);
        this.tip = null;

        this._setListeners();
      } // Getters


      static get Default() {
        return Default$3;
      }

      static get NAME() {
        return NAME$4;
      }

      static get Event() {
        return Event$2;
      }

      static get DefaultType() {
        return DefaultType$3;
      } // Public


      enable() {
        this._isEnabled = true;
      }

      disable() {
        this._isEnabled = false;
      }

      toggleEnabled() {
        this._isEnabled = !this._isEnabled;
      }

      toggle(event) {
        if (!this._isEnabled) {
          return;
        }

        if (event) {
          const context = this._initializeOnDelegatedTarget(event);

          context._activeTrigger.click = !context._activeTrigger.click;

          if (context._isWithActiveTrigger()) {
            context._enter(null, context);
          } else {
            context._leave(null, context);
          }
        } else {
          if (this.getTipElement().classList.contains(CLASS_NAME_SHOW$2)) {
            this._leave(null, this);

            return;
          }

          this._enter(null, this);
        }
      }

      dispose() {
        clearTimeout(this._timeout);
        EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);

        if (this.tip) {
          this.tip.remove();
        }

        this._disposePopper();

        super.dispose();
      }

      show() {
        if (this._element.style.display === 'none') {
          throw new Error('Please use show on visible elements');
        }

        if (!(this.isWithContent() && this._isEnabled)) {
          return;
        }

        const showEvent = EventHandler.trigger(this._element, this.constructor.Event.SHOW);
        const shadowRoot = findShadowRoot(this._element);
        const isInTheDom = shadowRoot === null ? this._element.ownerDocument.documentElement.contains(this._element) : shadowRoot.contains(this._element);

        if (showEvent.defaultPrevented || !isInTheDom) {
          return;
        } // A trick to recreate a tooltip in case a new title is given by using the NOT documented `data-bs-original-title`
        // This will be removed later in favor of a `setContent` method


        if (this.constructor.NAME === 'tooltip' && this.tip && this.getTitle() !== this.tip.querySelector(SELECTOR_TOOLTIP_INNER).innerHTML) {
          this._disposePopper();

          this.tip.remove();
          this.tip = null;
        }

        const tip = this.getTipElement();
        const tipId = getUID(this.constructor.NAME);
        tip.setAttribute('id', tipId);

        this._element.setAttribute('aria-describedby', tipId);

        if (this._config.animation) {
          tip.classList.add(CLASS_NAME_FADE$2);
        }

        const placement = typeof this._config.placement === 'function' ? this._config.placement.call(this, tip, this._element) : this._config.placement;

        const attachment = this._getAttachment(placement);

        this._addAttachmentClass(attachment);

        const {
          container
        } = this._config;
        Data.set(tip, this.constructor.DATA_KEY, this);

        if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
          container.append(tip);
          EventHandler.trigger(this._element, this.constructor.Event.INSERTED);
        }

        if (this._popper) {
          this._popper.update();
        } else {
          this._popper = createPopper(this._element, tip, this._getPopperConfig(attachment));
        }

        tip.classList.add(CLASS_NAME_SHOW$2);

        const customClass = this._resolvePossibleFunction(this._config.customClass);

        if (customClass) {
          tip.classList.add(...customClass.split(' '));
        } // If this is a touch-enabled device we add extra
        // empty mouseover listeners to the body's immediate children;
        // only needed because of broken event delegation on iOS
        // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html


        if ('ontouchstart' in document.documentElement) {
          [].concat(...document.body.children).forEach(element => {
            EventHandler.on(element, 'mouseover', noop);
          });
        }

        const complete = () => {
          const prevHoverState = this._hoverState;
          this._hoverState = null;
          EventHandler.trigger(this._element, this.constructor.Event.SHOWN);

          if (prevHoverState === HOVER_STATE_OUT) {
            this._leave(null, this);
          }
        };

        const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);

        this._queueCallback(complete, this.tip, isAnimated);
      }

      hide() {
        if (!this._popper) {
          return;
        }

        const tip = this.getTipElement();

        const complete = () => {
          if (this._isWithActiveTrigger()) {
            return;
          }

          if (this._hoverState !== HOVER_STATE_SHOW) {
            tip.remove();
          }

          this._cleanTipClass();

          this._element.removeAttribute('aria-describedby');

          EventHandler.trigger(this._element, this.constructor.Event.HIDDEN);

          this._disposePopper();
        };

        const hideEvent = EventHandler.trigger(this._element, this.constructor.Event.HIDE);

        if (hideEvent.defaultPrevented) {
          return;
        }

        tip.classList.remove(CLASS_NAME_SHOW$2); // If this is a touch-enabled device we remove the extra
        // empty mouseover listeners we added for iOS support

        if ('ontouchstart' in document.documentElement) {
          [].concat(...document.body.children).forEach(element => EventHandler.off(element, 'mouseover', noop));
        }

        this._activeTrigger[TRIGGER_CLICK] = false;
        this._activeTrigger[TRIGGER_FOCUS] = false;
        this._activeTrigger[TRIGGER_HOVER] = false;
        const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);

        this._queueCallback(complete, this.tip, isAnimated);

        this._hoverState = '';
      }

      update() {
        if (this._popper !== null) {
          this._popper.update();
        }
      } // Protected


      isWithContent() {
        return Boolean(this.getTitle());
      }

      getTipElement() {
        if (this.tip) {
          return this.tip;
        }

        const element = document.createElement('div');
        element.innerHTML = this._config.template;
        const tip = element.children[0];
        this.setContent(tip);
        tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
        this.tip = tip;
        return this.tip;
      }

      setContent(tip) {
        this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TOOLTIP_INNER);
      }

      _sanitizeAndSetContent(template, content, selector) {
        const templateElement = SelectorEngine.findOne(selector, template);

        if (!content && templateElement) {
          templateElement.remove();
          return;
        } // we use append for html objects to maintain js events


        this.setElementContent(templateElement, content);
      }

      setElementContent(element, content) {
        if (element === null) {
          return;
        }

        if (isElement(content)) {
          content = getElement(content); // content is a DOM node or a jQuery

          if (this._config.html) {
            if (content.parentNode !== element) {
              element.innerHTML = '';
              element.append(content);
            }
          } else {
            element.textContent = content.textContent;
          }

          return;
        }

        if (this._config.html) {
          if (this._config.sanitize) {
            content = sanitizeHtml(content, this._config.allowList, this._config.sanitizeFn);
          }

          element.innerHTML = content;
        } else {
          element.textContent = content;
        }
      }

      getTitle() {
        const title = this._element.getAttribute('data-bs-original-title') || this._config.title;

        return this._resolvePossibleFunction(title);
      }

      updateAttachment(attachment) {
        if (attachment === 'right') {
          return 'end';
        }

        if (attachment === 'left') {
          return 'start';
        }

        return attachment;
      } // Private


      _initializeOnDelegatedTarget(event, context) {
        return context || this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
      }

      _getOffset() {
        const {
          offset
        } = this._config;

        if (typeof offset === 'string') {
          return offset.split(',').map(val => Number.parseInt(val, 10));
        }

        if (typeof offset === 'function') {
          return popperData => offset(popperData, this._element);
        }

        return offset;
      }

      _resolvePossibleFunction(content) {
        return typeof content === 'function' ? content.call(this._element) : content;
      }

      _getPopperConfig(attachment) {
        const defaultBsPopperConfig = {
          placement: attachment,
          modifiers: [{
            name: 'flip',
            options: {
              fallbackPlacements: this._config.fallbackPlacements
            }
          }, {
            name: 'offset',
            options: {
              offset: this._getOffset()
            }
          }, {
            name: 'preventOverflow',
            options: {
              boundary: this._config.boundary
            }
          }, {
            name: 'arrow',
            options: {
              element: `.${this.constructor.NAME}-arrow`
            }
          }, {
            name: 'onChange',
            enabled: true,
            phase: 'afterWrite',
            fn: data => this._handlePopperPlacementChange(data)
          }],
          onFirstUpdate: data => {
            if (data.options.placement !== data.placement) {
              this._handlePopperPlacementChange(data);
            }
          }
        };
        return { ...defaultBsPopperConfig,
          ...(typeof this._config.popperConfig === 'function' ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig)
        };
      }

      _addAttachmentClass(attachment) {
        this.getTipElement().classList.add(`${this._getBasicClassPrefix()}-${this.updateAttachment(attachment)}`);
      }

      _getAttachment(placement) {
        return AttachmentMap[placement.toUpperCase()];
      }

      _setListeners() {
        const triggers = this._config.trigger.split(' ');

        triggers.forEach(trigger => {
          if (trigger === 'click') {
            EventHandler.on(this._element, this.constructor.Event.CLICK, this._config.selector, event => this.toggle(event));
          } else if (trigger !== TRIGGER_MANUAL) {
            const eventIn = trigger === TRIGGER_HOVER ? this.constructor.Event.MOUSEENTER : this.constructor.Event.FOCUSIN;
            const eventOut = trigger === TRIGGER_HOVER ? this.constructor.Event.MOUSELEAVE : this.constructor.Event.FOCUSOUT;
            EventHandler.on(this._element, eventIn, this._config.selector, event => this._enter(event));
            EventHandler.on(this._element, eventOut, this._config.selector, event => this._leave(event));
          }
        });

        this._hideModalHandler = () => {
          if (this._element) {
            this.hide();
          }
        };

        EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);

        if (this._config.selector) {
          this._config = { ...this._config,
            trigger: 'manual',
            selector: ''
          };
        } else {
          this._fixTitle();
        }
      }

      _fixTitle() {
        const title = this._element.getAttribute('title');

        const originalTitleType = typeof this._element.getAttribute('data-bs-original-title');

        if (title || originalTitleType !== 'string') {
          this._element.setAttribute('data-bs-original-title', title || '');

          if (title && !this._element.getAttribute('aria-label') && !this._element.textContent) {
            this._element.setAttribute('aria-label', title);
          }

          this._element.setAttribute('title', '');
        }
      }

      _enter(event, context) {
        context = this._initializeOnDelegatedTarget(event, context);

        if (event) {
          context._activeTrigger[event.type === 'focusin' ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
        }

        if (context.getTipElement().classList.contains(CLASS_NAME_SHOW$2) || context._hoverState === HOVER_STATE_SHOW) {
          context._hoverState = HOVER_STATE_SHOW;
          return;
        }

        clearTimeout(context._timeout);
        context._hoverState = HOVER_STATE_SHOW;

        if (!context._config.delay || !context._config.delay.show) {
          context.show();
          return;
        }

        context._timeout = setTimeout(() => {
          if (context._hoverState === HOVER_STATE_SHOW) {
            context.show();
          }
        }, context._config.delay.show);
      }

      _leave(event, context) {
        context = this._initializeOnDelegatedTarget(event, context);

        if (event) {
          context._activeTrigger[event.type === 'focusout' ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
        }

        if (context._isWithActiveTrigger()) {
          return;
        }

        clearTimeout(context._timeout);
        context._hoverState = HOVER_STATE_OUT;

        if (!context._config.delay || !context._config.delay.hide) {
          context.hide();
          return;
        }

        context._timeout = setTimeout(() => {
          if (context._hoverState === HOVER_STATE_OUT) {
            context.hide();
          }
        }, context._config.delay.hide);
      }

      _isWithActiveTrigger() {
        for (const trigger in this._activeTrigger) {
          if (this._activeTrigger[trigger]) {
            return true;
          }
        }

        return false;
      }

      _getConfig(config) {
        const dataAttributes = Manipulator.getDataAttributes(this._element);
        Object.keys(dataAttributes).forEach(dataAttr => {
          if (DISALLOWED_ATTRIBUTES.has(dataAttr)) {
            delete dataAttributes[dataAttr];
          }
        });
        config = { ...this.constructor.Default,
          ...dataAttributes,
          ...(typeof config === 'object' && config ? config : {})
        };
        config.container = config.container === false ? document.body : getElement(config.container);

        if (typeof config.delay === 'number') {
          config.delay = {
            show: config.delay,
            hide: config.delay
          };
        }

        if (typeof config.title === 'number') {
          config.title = config.title.toString();
        }

        if (typeof config.content === 'number') {
          config.content = config.content.toString();
        }

        typeCheckConfig(NAME$4, config, this.constructor.DefaultType);

        if (config.sanitize) {
          config.template = sanitizeHtml(config.template, config.allowList, config.sanitizeFn);
        }

        return config;
      }

      _getDelegateConfig() {
        const config = {};

        for (const key in this._config) {
          if (this.constructor.Default[key] !== this._config[key]) {
            config[key] = this._config[key];
          }
        } // In the future can be replaced with:
        // const keysWithDifferentValues = Object.entries(this._config).filter(entry => this.constructor.Default[entry[0]] !== this._config[entry[0]])
        // `Object.fromEntries(keysWithDifferentValues)`


        return config;
      }

      _cleanTipClass() {
        const tip = this.getTipElement();
        const basicClassPrefixRegex = new RegExp(`(^|\\s)${this._getBasicClassPrefix()}\\S+`, 'g');
        const tabClass = tip.getAttribute('class').match(basicClassPrefixRegex);

        if (tabClass !== null && tabClass.length > 0) {
          tabClass.map(token => token.trim()).forEach(tClass => tip.classList.remove(tClass));
        }
      }

      _getBasicClassPrefix() {
        return CLASS_PREFIX$1;
      }

      _handlePopperPlacementChange(popperData) {
        const {
          state
        } = popperData;

        if (!state) {
          return;
        }

        this.tip = state.elements.popper;

        this._cleanTipClass();

        this._addAttachmentClass(this._getAttachment(state.placement));
      }

      _disposePopper() {
        if (this._popper) {
          this._popper.destroy();

          this._popper = null;
        }
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Tooltip.getOrCreateInstance(this, config);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config]();
          }
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Tooltip to jQuery only if jQuery is present
     */


    defineJQueryPlugin(Tooltip);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): popover.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$3 = 'popover';
    const DATA_KEY$3 = 'bs.popover';
    const EVENT_KEY$3 = `.${DATA_KEY$3}`;
    const CLASS_PREFIX = 'bs-popover';
    const Default$2 = { ...Tooltip.Default,
      placement: 'right',
      offset: [0, 8],
      trigger: 'click',
      content: '',
      template: '<div class="popover" role="tooltip">' + '<div class="popover-arrow"></div>' + '<h3 class="popover-header"></h3>' + '<div class="popover-body"></div>' + '</div>'
    };
    const DefaultType$2 = { ...Tooltip.DefaultType,
      content: '(string|element|function)'
    };
    const Event$1 = {
      HIDE: `hide${EVENT_KEY$3}`,
      HIDDEN: `hidden${EVENT_KEY$3}`,
      SHOW: `show${EVENT_KEY$3}`,
      SHOWN: `shown${EVENT_KEY$3}`,
      INSERTED: `inserted${EVENT_KEY$3}`,
      CLICK: `click${EVENT_KEY$3}`,
      FOCUSIN: `focusin${EVENT_KEY$3}`,
      FOCUSOUT: `focusout${EVENT_KEY$3}`,
      MOUSEENTER: `mouseenter${EVENT_KEY$3}`,
      MOUSELEAVE: `mouseleave${EVENT_KEY$3}`
    };
    const SELECTOR_TITLE = '.popover-header';
    const SELECTOR_CONTENT = '.popover-body';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Popover extends Tooltip {
      // Getters
      static get Default() {
        return Default$2;
      }

      static get NAME() {
        return NAME$3;
      }

      static get Event() {
        return Event$1;
      }

      static get DefaultType() {
        return DefaultType$2;
      } // Overrides


      isWithContent() {
        return this.getTitle() || this._getContent();
      }

      setContent(tip) {
        this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TITLE);

        this._sanitizeAndSetContent(tip, this._getContent(), SELECTOR_CONTENT);
      } // Private


      _getContent() {
        return this._resolvePossibleFunction(this._config.content);
      }

      _getBasicClassPrefix() {
        return CLASS_PREFIX;
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Popover.getOrCreateInstance(this, config);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config]();
          }
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Popover to jQuery only if jQuery is present
     */


    defineJQueryPlugin(Popover);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): scrollspy.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$2 = 'scrollspy';
    const DATA_KEY$2 = 'bs.scrollspy';
    const EVENT_KEY$2 = `.${DATA_KEY$2}`;
    const DATA_API_KEY$1 = '.data-api';
    const Default$1 = {
      offset: 10,
      method: 'auto',
      target: ''
    };
    const DefaultType$1 = {
      offset: 'number',
      method: 'string',
      target: '(string|element)'
    };
    const EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
    const EVENT_SCROLL = `scroll${EVENT_KEY$2}`;
    const EVENT_LOAD_DATA_API = `load${EVENT_KEY$2}${DATA_API_KEY$1}`;
    const CLASS_NAME_DROPDOWN_ITEM = 'dropdown-item';
    const CLASS_NAME_ACTIVE$1 = 'active';
    const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
    const SELECTOR_NAV_LIST_GROUP$1 = '.nav, .list-group';
    const SELECTOR_NAV_LINKS = '.nav-link';
    const SELECTOR_NAV_ITEMS = '.nav-item';
    const SELECTOR_LIST_ITEMS = '.list-group-item';
    const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`;
    const SELECTOR_DROPDOWN$1 = '.dropdown';
    const SELECTOR_DROPDOWN_TOGGLE$1 = '.dropdown-toggle';
    const METHOD_OFFSET = 'offset';
    const METHOD_POSITION = 'position';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class ScrollSpy extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._scrollElement = this._element.tagName === 'BODY' ? window : this._element;
        this._config = this._getConfig(config);
        this._offsets = [];
        this._targets = [];
        this._activeTarget = null;
        this._scrollHeight = 0;
        EventHandler.on(this._scrollElement, EVENT_SCROLL, () => this._process());
        this.refresh();

        this._process();
      } // Getters


      static get Default() {
        return Default$1;
      }

      static get NAME() {
        return NAME$2;
      } // Public


      refresh() {
        const autoMethod = this._scrollElement === this._scrollElement.window ? METHOD_OFFSET : METHOD_POSITION;
        const offsetMethod = this._config.method === 'auto' ? autoMethod : this._config.method;
        const offsetBase = offsetMethod === METHOD_POSITION ? this._getScrollTop() : 0;
        this._offsets = [];
        this._targets = [];
        this._scrollHeight = this._getScrollHeight();
        const targets = SelectorEngine.find(SELECTOR_LINK_ITEMS, this._config.target);
        targets.map(element => {
          const targetSelector = getSelectorFromElement(element);
          const target = targetSelector ? SelectorEngine.findOne(targetSelector) : null;

          if (target) {
            const targetBCR = target.getBoundingClientRect();

            if (targetBCR.width || targetBCR.height) {
              return [Manipulator[offsetMethod](target).top + offsetBase, targetSelector];
            }
          }

          return null;
        }).filter(item => item).sort((a, b) => a[0] - b[0]).forEach(item => {
          this._offsets.push(item[0]);

          this._targets.push(item[1]);
        });
      }

      dispose() {
        EventHandler.off(this._scrollElement, EVENT_KEY$2);
        super.dispose();
      } // Private


      _getConfig(config) {
        config = { ...Default$1,
          ...Manipulator.getDataAttributes(this._element),
          ...(typeof config === 'object' && config ? config : {})
        };
        config.target = getElement(config.target) || document.documentElement;
        typeCheckConfig(NAME$2, config, DefaultType$1);
        return config;
      }

      _getScrollTop() {
        return this._scrollElement === window ? this._scrollElement.pageYOffset : this._scrollElement.scrollTop;
      }

      _getScrollHeight() {
        return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      }

      _getOffsetHeight() {
        return this._scrollElement === window ? window.innerHeight : this._scrollElement.getBoundingClientRect().height;
      }

      _process() {
        const scrollTop = this._getScrollTop() + this._config.offset;

        const scrollHeight = this._getScrollHeight();

        const maxScroll = this._config.offset + scrollHeight - this._getOffsetHeight();

        if (this._scrollHeight !== scrollHeight) {
          this.refresh();
        }

        if (scrollTop >= maxScroll) {
          const target = this._targets[this._targets.length - 1];

          if (this._activeTarget !== target) {
            this._activate(target);
          }

          return;
        }

        if (this._activeTarget && scrollTop < this._offsets[0] && this._offsets[0] > 0) {
          this._activeTarget = null;

          this._clear();

          return;
        }

        for (let i = this._offsets.length; i--;) {
          const isActiveTarget = this._activeTarget !== this._targets[i] && scrollTop >= this._offsets[i] && (typeof this._offsets[i + 1] === 'undefined' || scrollTop < this._offsets[i + 1]);

          if (isActiveTarget) {
            this._activate(this._targets[i]);
          }
        }
      }

      _activate(target) {
        this._activeTarget = target;

        this._clear();

        const queries = SELECTOR_LINK_ITEMS.split(',').map(selector => `${selector}[data-bs-target="${target}"],${selector}[href="${target}"]`);
        const link = SelectorEngine.findOne(queries.join(','), this._config.target);
        link.classList.add(CLASS_NAME_ACTIVE$1);

        if (link.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
          SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, link.closest(SELECTOR_DROPDOWN$1)).classList.add(CLASS_NAME_ACTIVE$1);
        } else {
          SelectorEngine.parents(link, SELECTOR_NAV_LIST_GROUP$1).forEach(listGroup => {
            // Set triggered links parents as active
            // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
            SelectorEngine.prev(listGroup, `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`).forEach(item => item.classList.add(CLASS_NAME_ACTIVE$1)); // Handle special case when .nav-link is inside .nav-item

            SelectorEngine.prev(listGroup, SELECTOR_NAV_ITEMS).forEach(navItem => {
              SelectorEngine.children(navItem, SELECTOR_NAV_LINKS).forEach(item => item.classList.add(CLASS_NAME_ACTIVE$1));
            });
          });
        }

        EventHandler.trigger(this._scrollElement, EVENT_ACTIVATE, {
          relatedTarget: target
        });
      }

      _clear() {
        SelectorEngine.find(SELECTOR_LINK_ITEMS, this._config.target).filter(node => node.classList.contains(CLASS_NAME_ACTIVE$1)).forEach(node => node.classList.remove(CLASS_NAME_ACTIVE$1));
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = ScrollSpy.getOrCreateInstance(this, config);

          if (typeof config !== 'string') {
            return;
          }

          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config]();
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
      SelectorEngine.find(SELECTOR_DATA_SPY).forEach(spy => new ScrollSpy(spy));
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .ScrollSpy to jQuery only if jQuery is present
     */

    defineJQueryPlugin(ScrollSpy);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): tab.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME$1 = 'tab';
    const DATA_KEY$1 = 'bs.tab';
    const EVENT_KEY$1 = `.${DATA_KEY$1}`;
    const DATA_API_KEY = '.data-api';
    const EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
    const EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
    const EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
    const EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
    const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}${DATA_API_KEY}`;
    const CLASS_NAME_DROPDOWN_MENU = 'dropdown-menu';
    const CLASS_NAME_ACTIVE = 'active';
    const CLASS_NAME_FADE$1 = 'fade';
    const CLASS_NAME_SHOW$1 = 'show';
    const SELECTOR_DROPDOWN = '.dropdown';
    const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group';
    const SELECTOR_ACTIVE = '.active';
    const SELECTOR_ACTIVE_UL = ':scope > li > .active';
    const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
    const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle';
    const SELECTOR_DROPDOWN_ACTIVE_CHILD = ':scope > .dropdown-menu .active';
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Tab extends BaseComponent {
      // Getters
      static get NAME() {
        return NAME$1;
      } // Public


      show() {
        if (this._element.parentNode && this._element.parentNode.nodeType === Node.ELEMENT_NODE && this._element.classList.contains(CLASS_NAME_ACTIVE)) {
          return;
        }

        let previous;
        const target = getElementFromSelector(this._element);

        const listElement = this._element.closest(SELECTOR_NAV_LIST_GROUP);

        if (listElement) {
          const itemSelector = listElement.nodeName === 'UL' || listElement.nodeName === 'OL' ? SELECTOR_ACTIVE_UL : SELECTOR_ACTIVE;
          previous = SelectorEngine.find(itemSelector, listElement);
          previous = previous[previous.length - 1];
        }

        const hideEvent = previous ? EventHandler.trigger(previous, EVENT_HIDE$1, {
          relatedTarget: this._element
        }) : null;
        const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$1, {
          relatedTarget: previous
        });

        if (showEvent.defaultPrevented || hideEvent !== null && hideEvent.defaultPrevented) {
          return;
        }

        this._activate(this._element, listElement);

        const complete = () => {
          EventHandler.trigger(previous, EVENT_HIDDEN$1, {
            relatedTarget: this._element
          });
          EventHandler.trigger(this._element, EVENT_SHOWN$1, {
            relatedTarget: previous
          });
        };

        if (target) {
          this._activate(target, target.parentNode, complete);
        } else {
          complete();
        }
      } // Private


      _activate(element, container, callback) {
        const activeElements = container && (container.nodeName === 'UL' || container.nodeName === 'OL') ? SelectorEngine.find(SELECTOR_ACTIVE_UL, container) : SelectorEngine.children(container, SELECTOR_ACTIVE);
        const active = activeElements[0];
        const isTransitioning = callback && active && active.classList.contains(CLASS_NAME_FADE$1);

        const complete = () => this._transitionComplete(element, active, callback);

        if (active && isTransitioning) {
          active.classList.remove(CLASS_NAME_SHOW$1);

          this._queueCallback(complete, element, true);
        } else {
          complete();
        }
      }

      _transitionComplete(element, active, callback) {
        if (active) {
          active.classList.remove(CLASS_NAME_ACTIVE);
          const dropdownChild = SelectorEngine.findOne(SELECTOR_DROPDOWN_ACTIVE_CHILD, active.parentNode);

          if (dropdownChild) {
            dropdownChild.classList.remove(CLASS_NAME_ACTIVE);
          }

          if (active.getAttribute('role') === 'tab') {
            active.setAttribute('aria-selected', false);
          }
        }

        element.classList.add(CLASS_NAME_ACTIVE);

        if (element.getAttribute('role') === 'tab') {
          element.setAttribute('aria-selected', true);
        }

        reflow(element);

        if (element.classList.contains(CLASS_NAME_FADE$1)) {
          element.classList.add(CLASS_NAME_SHOW$1);
        }

        let parent = element.parentNode;

        if (parent && parent.nodeName === 'LI') {
          parent = parent.parentNode;
        }

        if (parent && parent.classList.contains(CLASS_NAME_DROPDOWN_MENU)) {
          const dropdownElement = element.closest(SELECTOR_DROPDOWN);

          if (dropdownElement) {
            SelectorEngine.find(SELECTOR_DROPDOWN_TOGGLE, dropdownElement).forEach(dropdown => dropdown.classList.add(CLASS_NAME_ACTIVE));
          }

          element.setAttribute('aria-expanded', true);
        }

        if (callback) {
          callback();
        }
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Tab.getOrCreateInstance(this);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config]();
          }
        });
      }

    }
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
      if (['A', 'AREA'].includes(this.tagName)) {
        event.preventDefault();
      }

      if (isDisabled(this)) {
        return;
      }

      const data = Tab.getOrCreateInstance(this);
      data.show();
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Tab to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Tab);

    /**
     * --------------------------------------------------------------------------
     * Bootstrap (v5.1.3): toast.js
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
     * --------------------------------------------------------------------------
     */
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */

    const NAME = 'toast';
    const DATA_KEY = 'bs.toast';
    const EVENT_KEY = `.${DATA_KEY}`;
    const EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
    const EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
    const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
    const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
    const EVENT_HIDE = `hide${EVENT_KEY}`;
    const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
    const EVENT_SHOW = `show${EVENT_KEY}`;
    const EVENT_SHOWN = `shown${EVENT_KEY}`;
    const CLASS_NAME_FADE = 'fade';
    const CLASS_NAME_HIDE = 'hide'; // @deprecated - kept here only for backwards compatibility

    const CLASS_NAME_SHOW = 'show';
    const CLASS_NAME_SHOWING = 'showing';
    const DefaultType = {
      animation: 'boolean',
      autohide: 'boolean',
      delay: 'number'
    };
    const Default = {
      animation: true,
      autohide: true,
      delay: 5000
    };
    /**
     * ------------------------------------------------------------------------
     * Class Definition
     * ------------------------------------------------------------------------
     */

    class Toast extends BaseComponent {
      constructor(element, config) {
        super(element);
        this._config = this._getConfig(config);
        this._timeout = null;
        this._hasMouseInteraction = false;
        this._hasKeyboardInteraction = false;

        this._setListeners();
      } // Getters


      static get DefaultType() {
        return DefaultType;
      }

      static get Default() {
        return Default;
      }

      static get NAME() {
        return NAME;
      } // Public


      show() {
        const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);

        if (showEvent.defaultPrevented) {
          return;
        }

        this._clearTimeout();

        if (this._config.animation) {
          this._element.classList.add(CLASS_NAME_FADE);
        }

        const complete = () => {
          this._element.classList.remove(CLASS_NAME_SHOWING);

          EventHandler.trigger(this._element, EVENT_SHOWN);

          this._maybeScheduleHide();
        };

        this._element.classList.remove(CLASS_NAME_HIDE); // @deprecated


        reflow(this._element);

        this._element.classList.add(CLASS_NAME_SHOW);

        this._element.classList.add(CLASS_NAME_SHOWING);

        this._queueCallback(complete, this._element, this._config.animation);
      }

      hide() {
        if (!this._element.classList.contains(CLASS_NAME_SHOW)) {
          return;
        }

        const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);

        if (hideEvent.defaultPrevented) {
          return;
        }

        const complete = () => {
          this._element.classList.add(CLASS_NAME_HIDE); // @deprecated


          this._element.classList.remove(CLASS_NAME_SHOWING);

          this._element.classList.remove(CLASS_NAME_SHOW);

          EventHandler.trigger(this._element, EVENT_HIDDEN);
        };

        this._element.classList.add(CLASS_NAME_SHOWING);

        this._queueCallback(complete, this._element, this._config.animation);
      }

      dispose() {
        this._clearTimeout();

        if (this._element.classList.contains(CLASS_NAME_SHOW)) {
          this._element.classList.remove(CLASS_NAME_SHOW);
        }

        super.dispose();
      } // Private


      _getConfig(config) {
        config = { ...Default,
          ...Manipulator.getDataAttributes(this._element),
          ...(typeof config === 'object' && config ? config : {})
        };
        typeCheckConfig(NAME, config, this.constructor.DefaultType);
        return config;
      }

      _maybeScheduleHide() {
        if (!this._config.autohide) {
          return;
        }

        if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
          return;
        }

        this._timeout = setTimeout(() => {
          this.hide();
        }, this._config.delay);
      }

      _onInteraction(event, isInteracting) {
        switch (event.type) {
          case 'mouseover':
          case 'mouseout':
            this._hasMouseInteraction = isInteracting;
            break;

          case 'focusin':
          case 'focusout':
            this._hasKeyboardInteraction = isInteracting;
            break;
        }

        if (isInteracting) {
          this._clearTimeout();

          return;
        }

        const nextElement = event.relatedTarget;

        if (this._element === nextElement || this._element.contains(nextElement)) {
          return;
        }

        this._maybeScheduleHide();
      }

      _setListeners() {
        EventHandler.on(this._element, EVENT_MOUSEOVER, event => this._onInteraction(event, true));
        EventHandler.on(this._element, EVENT_MOUSEOUT, event => this._onInteraction(event, false));
        EventHandler.on(this._element, EVENT_FOCUSIN, event => this._onInteraction(event, true));
        EventHandler.on(this._element, EVENT_FOCUSOUT, event => this._onInteraction(event, false));
      }

      _clearTimeout() {
        clearTimeout(this._timeout);
        this._timeout = null;
      } // Static


      static jQueryInterface(config) {
        return this.each(function () {
          const data = Toast.getOrCreateInstance(this, config);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config](this);
          }
        });
      }

    }

    enableDismissTrigger(Toast);
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     * add .Toast to jQuery only if jQuery is present
     */

    defineJQueryPlugin(Toast);

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
