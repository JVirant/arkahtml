import { Vec2, Rect, Circle, distance, add, collideCR } from "./utils";

interface Brick {
	rect: Rect;
	$el: HTMLElement;
};

const boardSize = new Vec2(64, 32);
const paddle = new Rect(new Vec2(), new Vec2(4, 1));
const ball = new Circle(new Vec2(), 0.5);
const bricks = [] as Brick[];
const $paddle = document.createElement("div");
let viewScale = 1;
let ballVelocity = new Vec2(0, -5);
let ballState = 0;

let combo = 1;
let score = 0;

// inputs
let mousePos = new Vec2();

function updateBall() {
	if (ballState < 0)
		return;
	if (ballState === 0) {
		ball.pos = add(paddle.tl, new Vec2(paddle.size.x / 2 - ball.radius, -2 * ball.radius));
		return;
	}

	ball.pos = add(ball.pos, ballVelocity);
	if (ball.pos.x < 0 || ball.pos.x + 16 > boardSize.x)
		ballVelocity = new Vec2(-ballVelocity.x, ballVelocity.y);
	if (ball.pos.y < 0)
	ballVelocity = new Vec2(ballVelocity.x, -ballVelocity.y);
	if (ball.pos.y > boardSize.y) {
		ballState = -1;
		return;
	}

	if (collideCR(ball, paddle)) {
		const diff = ball.pos.x - paddle.tl.x - paddle.size.x / 2;
		const maxDiff = paddle.size.x / 2 + ball.radius;
		const maxDeflection = Math.PI / 6;

		combo = 1;
		if (diff > maxDiff || diff < -maxDiff) {
			ballVelocity = new Vec2(-ballVelocity.x, -ballVelocity.y);
			return;
		}
		const speed = distance(ballVelocity, new Vec2());
		const theta = Math.PI / -2 + diff / maxDiff * (Math.PI / 2 - maxDeflection);
		ballVelocity = new Vec2(Math.cos(theta) * speed, Math.sin(theta) * speed);
		return;
	}

	const doCollision = (r: Rect) => {
		const res = collideCR(ball, r);
		if (res) {
			ballVelocity = new Vec2(ballVelocity.x * (res & 0xF0 ? -1 : 1), ballVelocity.y * (res & 0x0F ? -1 : 1));
			score += combo;
			combo += 1;
			return true;
		}
		return false;
	};
	const toRemove = bricks.filter(b => doCollision(b.rect));
	for (const brick of toRemove) {
		brick.$el.remove();
		const i = bricks.indexOf(brick);
		bricks.splice(i, 1);
	}
}

function updatePaddle() {
	const x = Math.min(boardSize.x - paddle.size.x / 2, mousePos.x - paddle.size.x / 2);
	paddle.tl = new Vec2(x, boardSize.y - 16 - 24);
}

function updateScreen() {

	for (const brick of bricks)
		updateBrickView(brick);
	$paddle.textContent = score.toString().padStart(4, "0");
}

function createBrick(x: number, y: number, w: number): Brick {
	const $el = document.createElement("div");
	$el.style.zIndex = "10000";
	$el.style.position = `absolute`;
	$el.style.background = `#FF980E`;
	const brick: Brick = {
		rect: new Rect(new Vec2(x, y), new Vec2(w, 2)),
		$el,
	 };
	 updateBrickView(brick);
	 return brick;
};
function updateBrickView(brick: Brick) {
	brick.$el.style.width = `${brick.rect.size.x * viewScale}px`;
	brick.$el.style.height = `${brick.rect.size.y * viewScale}px`;
	brick.$el.style.top = `${brick.rect.tl.y * viewScale}px`;
	brick.$el.style.left = `${brick.rect.tl.x * viewScale}px`;
	brick.$el.style.border = `outset ${1 * viewScale}px #FFCE39`;
	brick.$el.style.boxShadow = `${1 * viewScale}px ${1 * viewScale}px #00000080`;
}

function init() {

}