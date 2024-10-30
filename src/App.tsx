import './App.css';
import { ComponentProps, useMemo, useState } from 'react';

import { BlurFilter, TextStyle } from 'pixi.js';
import { Stage, Container, Sprite, Text, useTick } from '@pixi/react';

const Bunny = (props: ComponentProps<typeof Sprite>) => {
    const [rotation, setRotation] = useState<number>(0);
    const [isRotating, setIsRotating] = useState<boolean>(false);

    useTick((delta: number) => {
        if (isRotating) {
            setRotation(rotation + delta * 0.07);
        }
    });

    const bunnyUrl = 'https://pixijs.io/pixi-react/img/bunny.png';

    return <Sprite
        {...props}
        eventMode='dynamic'
        image={bunnyUrl}
        anchor={0.5}
        rotation={rotation}
        onclick={() => setIsRotating(!isRotating)}
    />
}

const App = () => {
    const blurFilter = useMemo(() => new BlurFilter(2), []);

    return (
        <div style={{display: "flex", flexDirection: "column"}}>

            <Stage width={800} height={600} options={{background: 0x1099bb}}>
                <Bunny x={300} y={150}/>
                <Bunny x={500} y={150}/>
                <Bunny x={400} y={200}/>

                <Container x={200} y={200}>
                    <Text
                        text="Hello World"
                        anchor={0.5}
                        x={220}
                        y={150}
                        filters={[blurFilter]}
                        style={
                            new TextStyle({
                                align: 'center',
                                fill: '0xffffff',
                                fontSize: 50,
                                letterSpacing: 20,
                                dropShadow: true,
                                dropShadowColor: '#E72264',
                                dropShadowDistance: 6,
                            })
                        }
                    />
                </Container>
            </Stage>
        </div>
    );
};

export default App;
