import { ComponentType, Entity, System } from "../ecs.ts";


export default class PlayerInputSystem extends System {
    requiredComponents = new Set<ComponentType>();

    private pressedKeys: Set<string> = new Set();

    constructor() {
        super();
        window.addEventListener("keydown", event => this.pressedKeys.add(event.key));
        window.addEventListener("keyup", event => this.pressedKeys.delete(event.key));
    }

    update(_entities: Set<Entity>) {
        console.log("Currently pressed keys: ", this.pressedKeys);
    }
}