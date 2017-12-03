
define(function() {

	function Sequence(iterable, getIterator) {
	    if (getIterator === undefined) {
	       getIterator = i => i[Symbol.iterator]();
	    }
	    this[Symbol.iterator] = () => getIterator(iterable);
	    this.map = function map(f) {
            return new Sequence(iterable, inner => mapIterator(inner[Symbol.iterator](), f));
        }
	}

	Sequence.prototype = {
        get length() {
            return [...this].length;
        },
        get size() {
            return this.length;
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