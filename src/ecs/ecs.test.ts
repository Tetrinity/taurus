import { beforeEach, describe, test, expect } from "vitest";
import ECS, { Component, Entity, System } from "./ecs.ts";
import { ComponentType } from "react";

describe('ECS', () => {
    let ecs: ECS;

    beforeEach(() => {
        ecs = new ECS();
    });

    test('can add entities with components to the ECS', () => {
        const entity1 = ecs.createEntity();

        expect(ecs.getComponents(entity1).has(Position)).toBeFalsy();

        ecs.addComponentToEntity(entity1, new Position(0, 0), new Health(100));

        const components = ecs.getComponents(entity1);

        expect(components.has(Position)).toBeTruthy();
        expect(components.has(Health)).toBeTruthy();
        expect(components.has(NotUsedComponent)).toBeFalsy();

        expect(components.get(Position).x).toEqual(0);
        expect(components.get(Position).y).toEqual(0);
        expect(components.get(Health).health).toEqual(100);
    })

    test("can check if an entity has all required components", () => {
        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0), new Health(100));

        const components = ecs.getComponents(entity1);

        expect(components.hasAll([Position, Health])).toBeTruthy();
        expect(components.hasAll([Position])).toBeTruthy();
        expect(components.hasAll([Health])).toBeTruthy();
        expect(components.hasAll([Position, Health, NotUsedComponent])).toBeFalsy();
        expect(components.hasAll([NotUsedComponent])).toBeFalsy();
    });

    test("can remove components from an entity", () => {
        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0), new Health(100));

        const components = ecs.getComponents(entity1);

        expect(components.has(Position)).toBeTruthy();
        expect(components.has(Health)).toBeTruthy();

        ecs.removeComponent(entity1, Position);

        expect(components.has(Position)).toBeFalsy();
        expect(components.has(Health)).toBeTruthy();
    });

    test("can register systems and have existing entities automatically added to them", () => {
        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0), new Health(100));

        const entity2 = ecs.createEntity();
        ecs.addComponentToEntity(entity2, new Position(0, 0));

        const positionSystem = new PositionSystem();
        const healthSystem = new HealthSystem();
        const positionAndHealthSystem = new PositionAndHealthSystem();
        const emptySystem = new EmptySystem();
        const unusedSystem = new UnusedSystem(); // deliberately not added to the ECS
        ecs.addSystem(positionSystem);
        ecs.addSystem(healthSystem);
        ecs.addSystem(positionAndHealthSystem);
        ecs.addSystem(emptySystem);

        // run an update to detect which entities are seen by each system
        ecs.update();

        expect(positionSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(healthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1]));
        expect(positionAndHealthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1]));
        expect(emptySystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(unusedSystem.entitiesSeenLastUpdate).toBeNull();
    });

    test("can register systems and add entities that then get picked up by them", () => {
        const positionSystem = new PositionSystem();
        const healthSystem = new HealthSystem();
        const positionAndHealthSystem = new PositionAndHealthSystem();
        const emptySystem = new EmptySystem();
        ecs.addSystem(positionSystem);
        ecs.addSystem(healthSystem);
        ecs.addSystem(positionAndHealthSystem);
        ecs.addSystem(emptySystem);

        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0), new Health(100));

        const entity2 = ecs.createEntity();
        ecs.addComponentToEntity(entity2, new Position(0, 0));

        // run an update to detect which entities are seen by each system
        ecs.update();

        expect(positionSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(healthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1]));
        expect(positionAndHealthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1]));
        expect(emptySystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));

        ecs.addComponentToEntity(entity2, new Health(100));
        ecs.update();

        expect(positionSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(healthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(positionAndHealthSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
        expect(emptySystem.entitiesSeenLastUpdate).toEqual(new Set([entity1, entity2]));
    });

    test("entity components can be modified by systems", () => {
        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0));
        const entity2 = ecs.createEntity();
        ecs.addComponentToEntity(entity2, new Position(5, 8));

        ecs.addSystem(new AddingSystem());

        ecs.update();

        const entity1Position = ecs.getComponents(entity1).get(Position);
        const entity2Position = ecs.getComponents(entity2).get(Position);

        expect(entity1Position.x).toEqual(1);
        expect(entity1Position.y).toEqual(-1);
        expect(entity2Position.x).toEqual(6);
        expect(entity2Position.y).toEqual(7);

        ecs.update();

        expect(entity1Position.x).toEqual(2);
        expect(entity1Position.y).toEqual(-2);
        expect(entity2Position.x).toEqual(7);
        expect(entity2Position.y).toEqual(6);
    });

    test("entities marked for deletion are removed at the end of the update loop", () => {
        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0));
        const entity2 = ecs.createEntity();
        ecs.addComponentToEntity(entity2, new Position(5, 8));

        ecs.update();

        // nothing deleted yet, should still all exist
        expect(() => ecs.getComponents(entity1)).not.toThrow();
        expect(() => ecs.getComponents(entity2)).not.toThrow();

        ecs.deleteEntity(entity1);
        ecs.update();

        // only entity 1 should be deleted
        expect(() => ecs.getComponents(entity1)).toThrow();
        expect(() => ecs.getComponents(entity2)).not.toThrow();

        const entity3 = ecs.createEntity();
        ecs.addComponentToEntity(entity3, new Position(1, 1));
        const entity4 = ecs.createEntity();
        ecs.addComponentToEntity(entity4, new Health(100));
        ecs.addSystem(new DeleteEntitiesWithPositionSystem());
        ecs.update();

        // all entities with a Position component should be deleted
        expect(() => ecs.getComponents(entity1)).toThrow();
        expect(() => ecs.getComponents(entity2)).toThrow();
        expect(() => ecs.getComponents(entity3)).toThrow();
        expect(() => ecs.getComponents(entity4)).not.toThrow();
    });

    test("systems are only called once per update", () => {
        const system = new EmptySystem();
        ecs.addSystem(system);
        ecs.addSystem(new EmptySystem());
        ecs.addSystem(new EmptySystem());

        ecs.update();
        expect(system.timesCalled).toEqual(1);

        ecs.update();
        expect(system.timesCalled).toEqual(2);

        ecs.update();
        expect(system.timesCalled).toEqual(3);
    });

    test("systems are called in the order they were added", () => {
        const system1 = new AddingSystem();
        const system2 = new MultiplyingSystem();
        const system3 = new AddingSystem();
        ecs.addSystem(system1);
        ecs.addSystem(system2);
        ecs.addSystem(system3);

        const entity = ecs.createEntity();
        ecs.addComponentToEntity(entity, new Position(0, 0));

        ecs.update();
        let positionAfterUpdate = ecs.getComponents(entity).get(Position);
        expect(positionAfterUpdate.x).toEqual(3); // add 1, multiply by 2, add 1
        expect(positionAfterUpdate.y).toEqual(-3); // subtract 1, multiply by 2, subtract 1

        ecs.update();
        positionAfterUpdate = ecs.getComponents(entity).get(Position);
        expect(positionAfterUpdate.x).toEqual(9);
        expect(positionAfterUpdate.y).toEqual(-9);
    });

    test("entities marked for deletion in earlier systems are still processed by later systems", () => {
        const addingSystem = new AddingSystem();

        ecs.addSystem(new DeleteEntitiesWithPositionSystem());
        ecs.addSystem(addingSystem);

        const entity1 = ecs.createEntity();
        ecs.addComponentToEntity(entity1, new Position(0, 0));

        ecs.update();

        expect(() => ecs.getComponents(entity1)).toThrow(); // has been deleted

        // addingSystem still saw the entity that was deleted by the previous system
        expect(addingSystem.entitiesSeenLastUpdate).toEqual(new Set([entity1]));
    });
});

// define test components
class Position extends Component {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }
}

class Health extends Component {
    health: number;
    constructor(health: number) {
        super();
        this.health = health;
    }
}

class NotUsedComponent extends Component {
    someProperty: string;
    constructor(someProperty: string) {
        super();
        this.someProperty = someProperty;
    }
}

// define test systems
class PositionSystem extends System {
    requiredComponents = new Set([Position]);

    public entitiesSeenLastUpdate: Set<Entity> | null = null;
    public timesCalled: number = 0;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = entities;
        this.timesCalled++;
    }
}

class HealthSystem extends System {
    requiredComponents = new Set([Health]);

    public entitiesSeenLastUpdate: Set<Entity> | null = null;
    public timesCalled: number = 0;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = entities;
        this.timesCalled++;
    }
}

class PositionAndHealthSystem extends System {
    requiredComponents = new Set([Position, Health]);

    public entitiesSeenLastUpdate: Set<Entity> | null = null;
    public timesCalled: number = 0;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = entities;
        this.timesCalled++;
    }
}

class EmptySystem extends System {
    requiredComponents = new Set<ComponentType>();

    public entitiesSeenLastUpdate: Set<Entity> | null = null;
    public timesCalled: number = 0;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = entities;
        this.timesCalled++;
    }
}

class UnusedSystem extends System {
    requiredComponents = new Set([NotUsedComponent]);

    public entitiesSeenLastUpdate: Set<Entity> | null = null;
    public timesCalled: number = 0;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = entities;
        this.timesCalled++;
        throw new Error("This system should not have been called");
    }
}

class AddingSystem extends System {
    requiredComponents = new Set([Position]);

    public entitiesSeenLastUpdate: Set<Entity> | null = null;

    update(entities: Set<Entity>) {
        this.entitiesSeenLastUpdate = new Set(entities); // copy to allow deletion test to still see the entity

        for (const entity of entities) {
            const position = this.ecs.getComponents(entity).get(Position);
            position.x += 1;
            position.y -= 1;
        }
    }
}

class MultiplyingSystem extends System {
    requiredComponents = new Set([Position]);

    update(entities: Set<Entity>) {
        for (const entity of entities) {
            const position = this.ecs.getComponents(entity).get(Position);
            position.x *= 2;
            position.y *= 2;
        }
    }
}

class DeleteEntitiesWithPositionSystem extends System {
    requiredComponents = new Set([Position]);

    update(entities: Set<Entity>) {
        for (const entity of entities) {
            this.ecs.deleteEntity(entity);
        }
    }
}