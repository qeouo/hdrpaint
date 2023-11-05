
import ConvexHull from "./convexhull.js";
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"

export default class Triangle extends ConvexHull{
		constructor(){
			super();
			this.poses.push(new Vec3());
			this.poses.push(new Vec3());
			this.poses.push(new Vec3());
		}
	}
