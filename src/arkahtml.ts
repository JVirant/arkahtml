import { CPlayer } from "./CPlayer";
import { State } from "./main";
import { GAClogo, GAClogo2 } from "./map";
import { bump, song } from "./songs";
import { Vec2, Rect, Circle, add, collideCR, collideRR, distance, cloneDeep, rand } from "./utils";

enum BallState {
	Dead = 0,
	Waiting,
	Alive,
}

class Ball {
	vel = new Vec2(1, -3);
	el!: HTMLElement;
	state: BallState = BallState.Waiting;
	combo = 1;

	get pos(): Vec2 {
		const rect = this.el.getBoundingClientRect();
		return new Vec2(rect.x, rect.y);
	}
	set pos(pos: Vec2) {
		this.el.style.left = `${pos.x}px`;
		this.el.style.top = `${pos.y}px`;
	}

	get circle() {
		return new Circle(add(this.pos, new Vec2(8, 8)), 8);
	}
	get rect() {
		const rect = this.el.getBoundingClientRect();
		return new Rect(new Vec2(rect.x, rect.y), new Vec2(rect.width, rect.height));
	}

	constructor() {
		this.el = document.createElement("div");
		this.el.style.position = `absolute`;
		this.el.style.width = `16px`;
		this.el.style.height = `16px`;
		this.el.style.background = `radial-gradient(circle at 5px 5px, #FFCE39, #000000)`;
		this.el.style.zIndex = `10000`;
		this.el.style.borderRadius = `8px`;
		this.el.style.border = `#CE9D08 solid 1px`;
		this.el.style.boxShadow = `8px 8px #00000080`;
		container.appendChild(this.el);
	}
}
function updateBall(ball: Ball) {
	switch (ball.state) {
		case BallState.Waiting:
			ball.pos = add(paddle.pos, new Vec2(paddle.size.x / 2 - 8, -16));
			break;
		case BallState.Alive:
			ball.pos = add(ball.pos, ball.vel);
			if (ball.pos.x < 0 || ball.pos.x + 16 > screenSize.x)
				ball.vel = new Vec2(-ball.vel.x, ball.vel.y);
			if (ball.pos.y < 0)
				ball.vel = new Vec2(ball.vel.x, -ball.vel.y);
			if (ball.pos.y > screenSize.y)
				ball.state = BallState.Dead;

			if (collideCR(ball.circle, paddle.rect)) {
				const diff = ball.pos.x - paddle.rect.tl.x - paddle.rect.size.x / 2;
				const maxDiff = paddle.rect.size.x / 2 + ball.circle.radius;
				const maxDeflection = Math.PI / 6;

				ball.combo = 1;
				if (diff > maxDiff || diff < -maxDiff) {
					ball.vel = new Vec2(-ball.vel.x, -ball.vel.y);
					break;
				}
				const speed = distance(ball.vel, new Vec2());
				const theta = Math.PI / -2 + diff / maxDiff * (Math.PI / 2 - maxDeflection);
				ball.vel = new Vec2(Math.cos(theta) * speed, Math.sin(theta) * speed);
				break;
			}

			const doCollision = (r: Rect) => {
				const res = collideCR(ball.circle, r);
				if (res) {
					audioBump[audioBumpIdx].play();
					audioBumpIdx = (audioBumpIdx + 1) % audioBump.length;
					ball.vel = new Vec2(ball.vel.x * (res & 0xF0 ? -1 : 1), ball.vel.y * (res & 0x0F ? -1 : 1));
					score += ball.combo;
					ball.combo += 1;
					return true;
				}
				return false;
			};
			for (const element of elements) {
				const box = element.getBoundingClientRect();
				const r = new Rect(new Vec2(box.x, box.y), new Vec2(box.width, box.height));
				if (doCollision(r))
					element.remove();
			}
			break;
	}
}

class Paddle {
	el!: HTMLElement;

	get pos(): Vec2 {
		const rect = this.el.getBoundingClientRect();
		return new Vec2(rect.x, rect.y);
	}
	set pos(pos: Vec2) {
		this.el.style.left = `${pos.x}px`;
		this.el.style.top = `${pos.y}px`;
	}

	get size(): Vec2 {
		const rect = this.el.getBoundingClientRect();
		return new Vec2(rect.width, rect.height);
	}

	get rect() {
		const rect = this.el.getBoundingClientRect();
		return new Rect(new Vec2(rect.x, rect.y), new Vec2(rect.width, rect.height));
	}

	constructor() {
		this.el = document.createElement("div");
		this.el.style.width = `128px`;
		this.el.style.height = `24px`;
		this.el.style.background = `linear-gradient(0deg, #944611 0%, #db8951 100%)`;
		this.el.style.border = `outset 3px black`;
		this.el.style.borderRadius = `5px`;
		this.el.style.position = `absolute`;
		this.el.style.bottom = `16px`;
		this.el.style.left = `calc(50% - 64px)`;
		this.el.style.zIndex = `10001`;
		this.el.style.boxShadow = `8px 8px #00000080`;
		this.el.style.textAlign = "center";
		this.el.style.font = "14px monospace";
		container.appendChild(this.el);
	}
}
function updatePaddle(paddle: Paddle, state: State) {
	const x = Math.min(screenSize.x - 64, state.mouse.pos.x - 64);
	paddle.pos = new Vec2(x, screenSize.y - 16 - 24);
	paddle.el.textContent = score.toString().padStart(4, "0");
}

function refreshElements() {
	const ignore = [...balls.map(b => b.el), paddle.el];
	elements = Array.from(document.querySelectorAll<HTMLElement>(`*`))
		.filter(e => {
			if (!(e instanceof HTMLElement) || ignore.includes(e))
				return false;
			if (!["BUTTON", "A", "DIV"].includes(e.tagName))
				return false;
			if (!["block", "flex"].includes(getComputedStyle(e).display))
				return false;
			const bounds = e.getBoundingClientRect();
			if (bounds.width < 10 || bounds.height < 10)
				return false;
			if (bounds.bottom > bottom)
				return false;
			return true;
		});
	elements = elements.filter(e => {
		return !Array.from(e.children).some(e => e instanceof HTMLElement && elements.includes(e));
	});
}

let oldState: State | undefined = undefined;
function updateGame() {
	balls.forEach(updateBall);
	refreshElements();

	if (elements.length === 0) {
		alert(`Bien joué !\nScore: ${score}`);
		return false;
	}
	else if (balls.every(b => b.state === BallState.Dead)) {
		alert(`GAME OVER\n\nScore: ${score}`);
		document.location = document.location;
		return false;
	}
	return true;
}

function updateFromState(state: State) {
	updatePaddle(paddle, state);
	if (oldState?.mouse?.buttonLeftDown && !state.mouse.buttonLeftDown) {
		if (!audioSong) {
			console.log("start audio");
			const wave = playerSong?.createWave();
			audioSong = document.createElement("audio");
			audioSong.src = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));
			audioSong.loop = true;
			audioSong.play();

			const waveBump = playerBump?.createWave();
			const bump = document.createElement("audio");
			bump.src = URL.createObjectURL(new Blob([waveBump], { type: "audio/wav" }));
			for (let i = 0; i < 8; ++i)
				audioBump.push(bump.cloneNode(true) as HTMLAudioElement);
		}

		const ball = balls.find(b => b.state === BallState.Waiting);
		if (ball)
			ball.state = BallState.Alive;
	}
}

const container = document.body;

let time = Date.now();
let score = 0;

let background!: HTMLDivElement;
const balls: Ball[] = [];
const paddle: Paddle = new Paddle();
let screenSize: Vec2 = new Vec2();
let bottom: number = 0;
let elements: HTMLElement[] = [];
let level = 1;

let playerSong: CPlayer | undefined = undefined;
let audioSong: HTMLAudioElement | undefined = undefined;
let playerBump: CPlayer | undefined = undefined;
const audioBump: HTMLAudioElement[] = [];
let audioBumpIdx = 0;

export async function start(state: State) {
	screenSize = new Vec2(document.body.clientWidth, document.body.clientHeight);
	bottom = Math.max(80, (screenSize.y * 90 / 100) | 0);

	background = document.createElement("div");
	background.style.position = "fixed";
	background.style.width = "100vw";
	background.style.height = `100vh`;
	background.style.zIndex = "10000";
	document.body.prepend(background);

	refreshElements();
	balls.push(new Ball());
	balls[0].pos = new Vec2(20, 20);

	const $loadingBar = document.createElement("div");
	$loadingBar.style.position = "fixed";
	$loadingBar.style.width = "256px";
	$loadingBar.style.height = "32px";
	$loadingBar.style.top = `${screenSize.y / 2 - 16}px`;
	$loadingBar.style.left = `${screenSize.x / 2 - 128}px`;
	$loadingBar.style.zIndex = "15000";
	$loadingBar.style.border = "1px solid black";
	const progress = (ratio: number) => {
		ratio = (ratio * 100) | 0;
		$loadingBar.style.background = `linear-gradient(90deg, #3D8D3D 0%, #3D8D3D ${ratio}%, #3D3D3D ${ratio}%, #3D3D3D 100%)`;
		return ratio;
	};
	progress(0);
	document.body.append($loadingBar);
	await new Promise(r => setTimeout(r, 15));

	playerSong = new CPlayer();
	playerSong.init(song);
	while (progress(playerSong.generate()) < 1)
		await new Promise(r => setTimeout(r, 15));

	playerBump = new CPlayer();
	playerBump.init(bump);
	while (playerBump.generate() < 1)
		await new Promise(r => setTimeout(r, 15));

	progress(1);
	$loadingBar.remove();
	console.log(`init Arkahtml`, elements);
	/*
	elements.forEach(el => el.remove());
	refreshElements();
	elements.forEach(el => el.remove());
	refreshElements();
	elements.forEach(el => el.remove());
	refreshElements();
	/**/
}

export function update(state: State): boolean {
	try {
		const oldTime = time;

		if (state.screen.resized) {
			screenSize = new Vec2(container.clientWidth, container.clientHeight);
			bottom = Math.max(80, (screenSize.y * 90 / 100) | 0);
			background.style.width = `${screenSize.x}px`;
			background.style.height = `${screenSize.y}px`;
		}

		console.log(screenSize);

		time = Date.now();
		let elapsedTime = time - oldTime;
		if (elapsedTime >= 8)
			updateFromState(state);
		while (elapsedTime >= 8) {
			if (!updateGame()) {
				if (level === 1 && screenSize.x > 1550 && screenSize.y > 650) {
					level++;
					const { bricks, bounds } = _createMap(rand(1, 2) % 2 ? GAClogo : GAClogo2);
					const translation = new Vec2(screenSize.x / 2 - bounds.size.x / 2, Math.max(0, screenSize.y / 2 - bounds.size.y / 2 - 128));
					bricks.map(brick => {
						const div = _createBrick(brick.tl.x + translation.x, brick.tl.y + translation.y, brick.size.x);
						container.append(div);
					});
					balls.forEach(b => {
						b.state = BallState.Waiting;
						b.combo = 1;
					});
					refreshElements();
					break;
				}
				return false;
			}
			elapsedTime -= 8;
		}
		return true;
	}
	finally {
		oldState = cloneDeep(state);
	}
}

export async function stop() {
	audioSong?.pause();
	audioSong = undefined;
	playerSong = undefined;
	playerBump = undefined;
	audioBump.forEach(b => b.pause());

	paddle.el.remove();
	background.remove();
	balls.forEach(b => b.el.remove());
	balls.length = 0;
	elements.forEach(e => e.remove());
	elements.length = 0;
}



function _createBrick(x: number, y: number, w = 2) {
	const div = document.createElement("div");
	div.style.zIndex = "10000";
	div.style.width = `${w}px`;
	div.style.height = `32px`;
	div.style.position = `absolute`;
	div.style.top = `${y}px`;
	div.style.left = `${x}px`;
	div.style.background = `#FF980E`;
	div.style.border = `outset 5px #FFCE39`;
	div.style.boxShadow = `8px 8px #00000080`;
	return div;
};

function _createMap(map: string) {
	const bricks: Rect[] = [];
	map.split("\n").map((line, row) => {
		const y = row * 32;
		for (let x = 0; x < line.length; ++x) {
			if (line[x] !== "#")
				continue;
			if (line[x + 1] === "#")
				bricks.push(new Rect(new Vec2(x++ * 32, y), new Vec2(64, 32)));
			else
				bricks.push(new Rect(new Vec2(x * 32, y), new Vec2(32, 32)));
		}
	});
	return {
		bricks,
		bounds: new Rect(new Vec2(0, 0), new Vec2(Math.max(...bricks.map(b => b.br.x)), map.length * 32)),
	};
}