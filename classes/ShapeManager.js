const Manager = require("./Manager");

class ShapeManager extends Manager {
    add(item) {
        if ((item.groupId || item.type == 'finish' || item.type == 'start') && !this.findById(item.id)) {
            this.list.push(item);
        }
    }

    findByNodeId(id) {
        return this.list.find(item => item.nodeId === id);
    }

    findByName(name) {
        return this.list.find(item => item.content === name);
    }

    findByType(type) {
        return this.list.find(item => item.type === type);
    }

    findByGroupId(id) {
        //return this.list.find(item => item.type === type);

        let includeTypes = ["condition", "goto", "instruction", "macros", "action", "finish", "only_send", "apply", "forward", "postpone", "restart"];
        return this.list.filter(item => includeTypes.includes(item.type) && item.groupId === id);
    }

    findByTypeAndGroupId(type, id) {
        //return this.list.find(item => item.type === type);
        return this.list.filter(item => item.type === type && item.groupId === id);
    }

    findByTypesAndGroupId(types, id) {
        //return this.list.find(item => item.type === type);
        return this.list.filter(item => types.includes(item.type) && item.groupId === id);
    }

    findByGroup(id) {
        return this.list.filter(item => item.groupId === id);
    }

    findIsNodeById(id) {
        return this.list.filter(item => item.id === id && item.isNode === true)?.shift();
    }

    // removeShape(id) {
    //     this.shapes = this.shapes.filter(shape => shape.id !== id);
    // }

    // findShapesByType(type) {
    //     return this.shapes.filter(shape => shape.shapeType === type);
    // }
}

module.exports = ShapeManager;