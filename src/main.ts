import * as arkahtml from "./arkahtml";
import { Vec2 } from "./utils";

export interface State {
	mouse: {
		pos: Vec2;
		buttonLeftDown: boolean;
	};
	screen: {
		size: Vec2;
		resized: boolean;
	};
}

async function _main() {
	const state: State = {
		mouse: {
			pos: new Vec2(),
			buttonLeftDown: false,
		},
		screen: {
			size: new Vec2(document.body.clientWidth, document.body.clientHeight),
			resized: false,
		},
	};
	document.onresize = () => {
		state.screen.size = new Vec2(document.body.clientWidth, document.body.clientHeight);
		state.screen.resized = true;
	};

	document.onmousemove = ev => {
		state.mouse.pos = new Vec2(ev.clientX, ev.clientY);
	};
	document.onmousedown = ev => {
		state.mouse.buttonLeftDown = true;
	};
	document.onmouseup = ev => {
		state.mouse.buttonLeftDown = false;
	};

	await arkahtml.start(state);

	let running = true;
	const callback = (us: number) => {
		if (arkahtml.update(state))
			requestAnimationFrame(callback);
		else
			running = false;
	};
	requestAnimationFrame(callback);

	while (running)
		await new Promise(r => setTimeout(r, 50));

	await arkahtml.stop();
	await new Promise(r => setTimeout(r, 50));

	document.location.reload();
}

_main();
