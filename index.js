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
        //start();
        console.log(macrosEnable);
        console.log("- - - - - - - - - - - - - - - - - - - - - - -");
        console.log("JSONStream serialization complete!");
        console.log("- - - - - - - - - - - - - - - - - - - - - - -");
        // console.log("Count: " + Object.keys(GROUPMAP).length);
        // console.log("Shapes: " + shapes.length);
        // console.log("Connectors: " + connectors.length);
        // console.log("Groups: " + groups.length);
        // console.log("Start: " + util.inspect(startNode));
        // console.log(util.inspect(groups, false, null, true));
        // console.log("- - - - - - - - - - - - - - - - - - - - - - -");
        console.log("- - - - - - - - - - Shapes - - - - - - - - - -");
        //console.log(Shapes.all[Shapes.all.length - 1]);
        console.log(Shapes.all.length);
        console.log("- - - - - - - - - - Conns - - - - - - - - - -");
        //console.log(Connectors.all[Connectors.all.length - 1]);
        console.log(Connectors.all.length);
        console.log("- - - - - - - - - - Group - - - - - - - - - -");
        //console.log(Groups.all[Groups.all.length - 1]);
        console.log(Groups.all.length);
        console.log("- - - - - - - - - - Start - - - - - - - - - -");
        createNode();
        console.log("- - - - - - - - - - Stop - - - - - - - - - -");
        console.log("- - - - - - - - - - Nodes - - - - - - - - - -");
        console.log(Nodes.all.length);
        fs.writeFile(
            outputPath.includes(".json")
                ? "output/test-" + outputPath
                : outputPath + "output/test.json",
            JSON.stringify(
                { entrypoint: entryPoint, nodes: Shapes.all },
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

        fs.writeFile(
            outputPath.includes(".json")
                ? "output/nodes" + outputPath
                : "output/nodes.json",
            JSON.stringify(
                { entrypoint: entryPoint, nodes: Nodes.getJson() },
                null,
                4
            ),
            (err) => {
                if (err) console.log(err);
                else {
                    console.log(`Файл уcпешно сохранен с именем nodes`);
                }
            }
        );
    });

let tempIter = 1;

function createNode(shape = Shapes.findByType("start"), toPoint) {
    console.log("- - - - - - - - - - - - - - - - - - - -");
    console.log("Итерация: " + tempIter, "След. нода " + toPoint);
    console.log("Тип ноды: " + shape.type, "ID ноды: " + shape.id);

    if (tempIter > 200) {
        console.log("Превышен лимит цикла");
        return false;
    }
    tempIter++;

    if (fakeFinish || (Nodes.findToIdById(2).length > 0 && !Nodes.findById(2))) { //fakeFinish && !Nodes.findByType("finish")
        console.log("Добавлен фейк-финиш".blue);
        fakeFinish = false;
        Nodes.add( new Node({ nodeId: 2, type: "finish" }) );
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
    console.log("Присвое NodeID: " + node.id);
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

        let params = { shape: shape,  groupShape: gShape, point: nextShapePoint, macrosEnable };

        node.addAction(params);
    });

    if (groupShapes.length <= 1) {
        node.fillExample();
    }

    //TODO УТОЧНИТЬ У КАКИХ ТИПОВ НУЖНО ДОБАВЛЯТЬ ЛИНЮЮ НОДУ ВЫКЛЮЧЕННУЮ ЕСЛИ ОНА ОДНА В ГРУППЕ


    // let connectorIds = shape.connectorIds;

    // node.shapeId = shapeId;
    // node.type = type;
    // node.title = type != "action" ? content : undefined;

    // let indexOfPoint = 1;

    // groupIds.forEach((id) => {
    //     let groupShape = getShapeById(id);-
    //     let groupFillColor = groupShape?.fillColor;-
    //     let groupShapeType = COLORTYPES[groupFillColor];-
    //     let groupShapeContent = groupShape?.content;-

    //     if (groupShapeType == "description") {
    //         node.description = groupShapeContent;
    //         return false;
    //     }

    //     let groupConnectorIds = groupShape.connectorIds;
    //     let nextShapeConnector = getConnectorById(groupConnectorIds[0]);
    //     let nextShapeId = nextShapeConnector?.end;
    //     let nextPoint = iterIndexPoint(indexPoint, true, indexOfPoint);

    //     if (nextShapeId && !GROUPMAP.hasOwnProperty(nextShapeId)) {
    //         indexOfPoint++;
    //         start(getShapeById(nextShapeId), nextPoint);
    //     }

    //     nextPoint = GROUPMAP[nextShapeId];
    //     node.actions.push({
    //         //shapeId: id,
    //         type: groupShapeType,
    //         ...(groupShapeType == "instruction"
    //             ? { title: content, description: groupShapeContent }
    //             : { title: groupShapeContent }),
    //         ...(groupShapeType == "macros"
    //             ? {
    //                   to_id: nextPoint || "2",
    //                   value: macrosEnable
    //                       ? groupShapeContent.match(/macro_var_\w*/gi)[0]
    //                       : "",
    //               }
    //             : { to_id: nextPoint || "2" }),
    //     });
    // });
}

//* Если action в ноде ВСЕГО ОДИН, то создать дополнительный action c тем, что он должен быть помечен как is_disabled: true
//* Если бордерколор RED - is_disabled: true
//* Если текст в [квадратных скобках] значит это - discription - ГОТОВО
//* Текст обрамленный -Тире- ивырезать и игнорировать - ГОТОВО
//* За основу брать текст в *Звездочках* - ГОТОВО
