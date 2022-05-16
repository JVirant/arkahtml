export class Vec2 {
	readonly x: number;
	readonly y: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
}
export function add(a: Vec2, b: Vec2): Vec2 {
	return new Vec2(a.x + b.x, a.y + b.y);
}
export function inverse(v: Vec2): Vec2 {
	return new Vec2(-v.x, -v.y);
}
export function divide(v: Vec2, d: number) {
	return new Vec2(v.x / d, v.y / d);
}

export enum Side {
	Top = 0x01,
	Bottom = 0x02,
	Left = 0x10,
	Right = 0x20,
}

export class Rect {
	tl: Vec2;
	size: Vec2;
	get br() {
		return add(this.tl, this.size);
	}
	

	constructor(pos: Vec2, size: Vec2) {
		this.tl = pos;
		this.size = size;
	}

	contains(v: Vec2) {
		return this.tl.x >= v.x && this.br.x < v.x
			&& this.tl.y < v.y && this.br.y >= v.y;
	}
}
export function collideRR(a: Rect, b: Rect) {
	if (a.br.x < b.tl.x || a.tl.x > b.br.x)
		return false;
	if (a.tl.y > b.br.y || a.br.y < b.tl.y)
		return false;
	return true;
}

export class Circle {
	pos: Vec2;
	radius: number;

	constructor(pos: Vec2, radius: number) {
		this.pos = pos;
		this.radius = radius;
	}
}
export function collideCR(c: Circle, r: Rect): Side | undefined {
	const nearX = Math.max(r.tl.x, Math.min(c.pos.x, r.br.x));
	const nearY = Math.max(r.tl.y, Math.min(c.pos.y, r.br.y));
	const dx = c.pos.x - nearX;
	const dy = c.pos.y - nearY;
	if ((dx * dx + dy * dy) >= c.radius * c.radius)
		return undefined;
	const sx = dx / (r.size.x / 2 + c.radius);
	const sy = dy / (r.size.y / 2 + c.radius);
	if (Math.abs(sy) < Math.abs(sx))
		return sx > 0 ? Side.Left : Side.Right;
	return sy > 0 ? Side.Top : Side.Bottom;
}

export function distance(a: Vec2, b: Vec2) {
	const d = add(a, inverse(b));
	return Math.sqrt(d.x * d.x + d.y * d.y);
}
