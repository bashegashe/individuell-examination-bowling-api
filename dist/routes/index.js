"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookings_route_1 = require("./bookings.route");
const routes = (0, express_1.Router)();
routes.use('/bookings', bookings_route_1.bookingsRouter);
exports.default = routes;
