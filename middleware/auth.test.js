"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureAdmin", () => {
  test("works", () => {
    expect.assertions(1)
    let req = {};
    let res = { locals: { user: { username: "test", isAdmin: true } } };
    let next = (e) => {
      expect(e).toBeFalsy();
    }
    ensureAdmin(req, res, next)
  })
  test("throws unathorized error if not admin", () => {
    expect.assertions(1)
    let req = {};
    let res = { locals: { user: { username: "test", isAdmin: false } } };
    let next = (e) => {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
    ensureAdmin(req, res, next)
  })
  test("throws unauthorized error if anon", () => {
    expect.assertions(1)
    let req = {};
    let res = { locals: {} };
    let next = (e) => {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
    ensureAdmin(req, res, next)
  })
})

describe("ensureCorrectUserOrAdmin", () => {
  test("work with admin", () => {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "admin", isAdmin: true } } };
    const next = function (e) {
      expect(e).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  })
  test("work with same user", () => {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  })
  test("throws unathorized error if anon", () => {
    expect.assertions(1);
    let req = { params: { username: "test" } };
    let res = { locals: {} };
    let next = (e)  => {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  })
  test("throws unathorized error if username mismatch", () => {
    expect.assertions(1);
    let req = { params: { username: "wrongTest" } };
    let res = { locals: { user: { username: "test", isAdmin: false } } };
    let next = (e)  => {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  })
})
