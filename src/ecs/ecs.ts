import { v4 as uuid } from "uuid";

// Entity - just an ID to keep track of associated components
export type Entity = string;

// Component - plain old data that gets associated with an entity
export abstract class Component {}

// helper type to allow calling (e.g.) get(Position) to return a Position instance
type ComponentClass<T extends Component> = new (...args: Array<any>) => T
// a more generic version of the above, used when we have multiple components
export type ComponentType = Function;

// System - each frame, updates entities with the required components
export abstract class System {
    public abstract requiredComponents: Set<ComponentType>;
    public abstract update(entities: Set<Entity>): void
    public ecs!: ECS; // technically can be undefined, but it'll be set when registering the system with the ECS
}

// ComponentContainer - helper functions for managing components associated with an entity.
// the typing means we can add a component instance [e.g. add(new Position(...))], while
// providing the component class when getting, checking, or deleting [e.g. get(Position)].
// add and delete should only be used internally by the ECS class to avoid an inaccurate cache.
class ComponentContainer {
    // most of the time, we can use ComponentClass<T>
    private map = new Map<ComponentType, Component>()

    public __add(component: Component): void {
        this.map.set(component.constructor, component);
    }

    public get<T extends Component>(componentClass: ComponentClass<T>): T {
        return this.map.get(componentClass) as T;
    }

    public has(componentClass: ComponentType): boolean {
        return this.map.has(componentClass);
    }

    public hasAll(componentClasses: Iterable<ComponentType>): boolean {
        for (let cls of componentClasses) {
            if (!this.map.has(cls)) {
                return false;
            }
        }
        return true;
    }

    public __delete(componentClass: ComponentType): void {
        this.map.delete(componentClass);
    }
}

class ECS {
    private entities = new Map<Entity, ComponentContainer>();
    private systems = new Map<System, Set<Entity>>();
    private systemOrder = new Array<System>();

    public static TARGET_UPDATES_PER_SECOND = 30;

    // entities are deleted at the end of the update loop to keep things consistent throughout the frame
    private entitiesMarkedForDeletion = new Set<Entity>();

    public createEntity(): Entity {
        const entity = uuid();
        this.entities.set(entity, new ComponentContainer());
        return entity;
    }

    public deleteEntity(entity: Entity): void {
        // soft-delete entities, will be cleared at the end of the next update loop
        this.entitiesMarkedForDeletion.add(entity);
    }


    public addComponentToEntity(entity: Entity, ...components: Array<Component>): void {
        const entityComponentContainer = this.entities.get(entity);
        if (!entityComponentContainer) {
            throw new Error(`Attempted to add component to non-existent entity ${entity}. This is likely a bug in the calling code.`);
        }

        components.forEach(component => entityComponentContainer.__add(component));
        this.refreshEntityCaches(entity);
    }

    public getComponents(entity: Entity): ComponentContainer {
        if (!this.entities.has(entity)) {
            throw new Error(`Attempted to get components for non-existent entity ${entity}. This is likely a bug in the calling code.`);
        }

        return this.entities.get(entity)!;
    }

    public removeComponent(entity: Entity, componentClass: ComponentType): void {
        const entityComponentContainer = this.entities.get(entity);
        if (!entityComponentContainer) {
            throw new Error(`Attempted to remove ${componentClass.constructor.name} component to non-existent entity ${entity}. This is likely a bug in the calling code.`);
        }
        entityComponentContainer.__delete(componentClass);
        this.refreshEntityCaches(entity);
    }


    public addSystem(system: System): void {
        system.ecs = this;

        this.systems.set(system, new Set());
        for (const entity of this.entities.keys()) {
            this.refreshSystemEntityCache(system, entity);
        }

        this.systemOrder.push(system);
    }

    // redetermine which systems should care about this entity
    private refreshEntityCaches(entity: Entity): void {
        for (const system of this.systems.keys()) {
            this.refreshSystemEntityCache(system, entity);
        }
    }

    // redetermine whether this system should care about this entity
    private refreshSystemEntityCache(system: System, entity: Entity): void {
        const entityComponentContainer = this.entities.get(entity);
        if (!entityComponentContainer) {
            throw new Error(`Attempted to refresh system entity cache for non-existent entity ${entity}. This is a bug in the ECS system.`);
        }

        const systemEntities = this.systems.get(system);
        if (!systemEntities) {
            throw new Error(`Attempted to refresh system entity cache for unregistered system ${system}. This is a bug in the ECS system.`);
        }

        if (entityComponentContainer.hasAll(system.requiredComponents)) {
            systemEntities.add(entity);
        } else {
            systemEntities.delete(entity);
        }
    }


    public update(_timestep: number = 1000.0 / ECS.TARGET_UPDATES_PER_SECOND): void {
        for (const system of this.systemOrder) {
            const systemEntities = this.systems.get(system);
            system.update(systemEntities!);
        }

        // hard-delete entities marked for deletion. also clear from system caches
        this.entitiesMarkedForDeletion.forEach(entity => {
            this.entities.delete(entity);

            for (const systemEntities of this.systems.values()) {
                systemEntities.delete(entity);
            }
        });

        this.entitiesMarkedForDeletion.clear();
    }
}

export default ECS;
