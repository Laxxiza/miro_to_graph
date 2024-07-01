const colors = require('colors');
const fs = require("fs");
const he = require("he");
const { program } = require("commander");
const JSONStream = require("JSONStream");
let {
    entryPoint,
    pathFile,
    macrosEnable,
    outputPath,
    fakeFinish,
    defects
} = require("./options");

const jsonStream = fs.createReadStream(pathFile);
const { indexPointIteration } = require("./utils");

const Shape = require("./classes/Shape");
const Connector = require("./classes/Connector");
const Group = require("./classes/Group");
const Node = require("./classes/Node");

const ShapeManager = require("./classes/ShapeManager");
const ConnectorManager = require("./classes/ConnectorManager");
const GroupManager = require("./classes/GroupManager");
const NodeManager = require("./classes/NodeManager");

const Shapes = new ShapeManager();
const Connectors = new ConnectorManager();
const Groups = new GroupManager();
const Nodes = new NodeManager();

const ENTRYPOINT = entryPoint;

jsonStream
    .pipe(JSONStream.parse(["", { emitKey: true }]))
    .on("data", (data) => {
        let dataType = data.type;
        switch (dataType) {
            case "shape":
                data.content = he.decode(data.content);
                Shapes.add(new Shape(data));
                break;
            case "connector":
                Connectors.add(new Connector(data));
                break;
            case "group":
                Groups.add(new Group(data));
                break;
        }
        Shapes.sort();
    })
    .on("end", () => {
        Shapes.checkDefect(Connectors.all);
        console.log("- - - - - - - - - - - - - - - - - - - - - - -");
        console.log("JSONStream serialization complete!");
        console.log("- - - - - - - - - - - - - - - - - - - - - - -");
        console.log(`- - - - - - - - - - Shapes: ${Shapes.all.length} - - - - - - - - - -`);
        console.log(`- - - - - - - - - - Conns: ${Connectors.all.length} - - - - - - - - - -`);
        console.log(`- - - - - - - - - - Groups: ${Groups.all.length} - - - - - - - - - -`);
        console.log(`- - - - - - - - - - Дефектные шейпы: ${Shapes.allDefect.length} - - - - - - - - - -`);
        if(Shapes.allDefect.length > 0){
            console.log(Shapes.allDefect);
            console.log("Сохранение прервано!\nПоправь дефекты и попробуй снова");
            if(defects) return false;
        }
        console.log("- - - - - - - - - - Start - - - - - - - - - -");
        createNode();
        console.log("- - - - - - - - - - Stop - - - - - - - - - -");
        console.log(`- - - - - - - - - - Nodes: ${Nodes.all.length} - - - - - - - - - -`);

        
        // fs.writeFile(
        //     outputPath.includes(".json")
        //         ? "output/test-" + outputPath
        //         : outputPath + "output/test.json",
        //     JSON.stringify(
        //         { entrypoint: entryPoint, nodes: Shapes.all },
        //         null,
        //         4
        //     ),
        //     (err) => {
        //         if (err) console.log(err);
        //         else {
        //             console.log(`Файл уcпешно сохранен с именем ${outputPath}`);
        //         }
        //     }
        // );

        fs.writeFile(
            outputPath.includes(".json")
                ? outputPath
                : outputPath + ".json",
            JSON.stringify(
                { entrypoint: entryPoint, nodes: Nodes.getJson() },
                null,
                4
            ),
            (err) => {
                if (err) console.log(err);
                else {
                    console.log(`Файл уcпешно сохранен с именем ${outputPath}`);
                }
            }
        );
        console.log("- - - - - - - - - - - - - - - - - - - - - - -");
    });

let tempIter = 1;

function createNode(shape = Shapes.findByType("start"), toPoint) {
    // console.log("- - - - - - - - - - - - - - - - - - - -");
    // console.log("Итерация: " + tempIter, "След. нода " + toPoint);
    // console.log("Тип ноды: " + shape.type, "ID ноды: " + shape.id);

    // if (tempIter > 500) {
    //     console.log("Превышен лимит цикла");
    //     return false;
    // }
    tempIter++;

    if (fakeFinish || (Nodes.findToIdById(2).length > 0 && !Nodes.findById(2))) { //fakeFinish && !Nodes.findByType("finish")
        console.log("Добавлен фейк-финиш".blue);
        fakeFinish = false;
        let finishNode = new Node({ nodeId: 2, type: "finish" });
        finishNode.fillExample();
        Nodes.add( finishNode );
    }

    if (!shape.groupId) {
        if (!shape.type == "start") {
            return false;
        }

        let connector = Connectors.findById(shape.connectorIds[0]);
        shape.isNode = true;
        console.log("БЕЗ ГРУППЫ", shape.id);
        createNode(Shapes.findById(connector.end));
        return false;
    }

    let node = new Node(shape);
    Nodes.add(node);
    shape.isNode = true;

    let descriptionShape = Shapes.findByTypeAndGroupId("description", shape.groupId)?.shift();

    //node.shapeId = shape?.id;
    node.id = toPoint || ENTRYPOINT;
    //console.log("Присвое NodeID: " + node.id);
    shape.nodeId = node.id;
    node.description = descriptionShape?.content || undefined;

    let groupShapes = Shapes.findByGroupId(shape.groupId).filter((gShape) => gShape.id !== shape.id);

    let indexOfPoint = 1;
    groupShapes.forEach((gShape) => {
        let nextShapePoint = indexPointIteration(node.id, true, indexOfPoint);
        let nextShapeId = Connectors.findById(gShape.connectorIds?.shift())?.end;
        let nextShape = Shapes.findById(nextShapeId);

        if (nextShapeId && !nextShape?.isNode) {
            indexOfPoint++;
            createNode(nextShape, nextShapePoint);
        }

        nextShapePoint = nextShape?.nodeId;

        let params = { shape: shape, groupShape: gShape, point: nextShapePoint, macrosEnable };

        node.addAction(params);
    });

    if (groupShapes.length <= 1) {
        node.fillExample();
    }
}