class Manager {
    constructor() {
        this.list = [];
        this.defectList = [];
    }

    get all() {
        return this.list;
    }

    get allDefect() {
        return this.defectList;
    }

    add(item) {
        if (!this.findById(item.id) && item.type) {
            this.list.push(item);
        }
    }

    addDefect(item) {
        if (item.type) {
            this.defectList.push(item);
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