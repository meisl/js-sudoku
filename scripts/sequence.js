
define(function() {

	function Sequence(iterable, getIterator) {
	    if (getIterator === undefined) {
	       getIterator = i => i[Symbol.iterator]();
	    }
	    this[Symbol.iterator] = () => getIterator(iterable);
	    this.map = function map(f) {
            let out = new Sequence(iterable, i => mapIterator(getIterator(i), f));
            out.transform = { map: f };
            return out;
        };
        this.inner = iterable;
	}

	Sequence.prototype = {
		get values() { return [...this] },
        get length() {
            return [...this].length;
        },
        get size() {
            return this.length;
        },
        filter: function (cb, thisValue) {
        	let out = new Sequence(this, inner => {
        		let it = inner[Symbol.iterator]();
				let origNext = it.next;
				let i = 0;
				it.next = function() {
					let e;
					do {
						e = origNext.call(this);
					} while (!e.done && !cb.call(thisValue, e.value, i++));
					return e;
				}
				return it;
        	});
        	out.transform = { filter: cb };
        	return out;
        },
        forEach: function (cb, thisValue) {
            let it = this[Symbol.iterator]();
            let e = it.next();
            for (let i = 0; !e.done; e = it.next()) {
                cb.call(thisValue, e.value, i++);
            }
        }
	};

	function mapIterator(it, f) {
        let origNext = it.next.bind(it);
        let i = 0;
	    it.next = () => {
	        let elem = origNext();
	        if (!elem.done) {
	            elem.value = f(elem.value, i++);
	        }
	        return elem;
	    }
	    return it;
	}


	return Sequence;
});