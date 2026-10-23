import {actor,json} from '../../../lib/server';
export async function GET(){return json({actor:await actor()})}
