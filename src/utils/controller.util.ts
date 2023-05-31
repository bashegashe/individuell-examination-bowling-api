import { type Request, type Response, type NextFunction } from 'express';

type Controller = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function controller(controller: Controller): Controller {
  return async function(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await controller(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
