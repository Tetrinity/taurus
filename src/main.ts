import './index.css';

import { Application } from 'pixi.js';
import ECS from "./ecs/ecs.ts";
import PlayerInputSystem from "./ecs/systems/PlayerInputSystem.ts";

(async () =>
{
    const ecs = new ECS();
    const targetDeltaMs = 1000.0 / ECS.TARGET_UPDATES_PER_SECOND;

    ecs.addSystem(new PlayerInputSystem());


    const app = new Application();
    await app.init({ background: '#1099bb', resizeTo: window });

    document.body.appendChild(app.canvas);

    let timeAccumulator = 0;

    app.ticker.add((time) =>
    {
        timeAccumulator += time.deltaMS;

        while (timeAccumulator >= targetDeltaMs) {
            ecs.update(targetDeltaMs);
            timeAccumulator -= targetDeltaMs;
        }

        // render
        // TODO: render :)
    });
})();