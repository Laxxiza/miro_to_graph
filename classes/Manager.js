class Manager {
    constructor() {
        this.list = [];
    }

    get all() {
        return this.list;
    }

    add(item) {
        if (!this.findById(item.id) && item.type) {
            this.list.push(item);
        }
    }

    findById(id) {
        return this.list.find(item => item.id === id);
    }

    findByType(type) {
        return this.list.find(item => item.type === type);
    }

    sort(){
        this.list.sort((a, b) => {
            return a.id.localeCompare(b.id)
        });
    }
}

module.exports = Manager;