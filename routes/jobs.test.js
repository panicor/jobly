"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//POST /jobs

describe("POST /jobs", () => {
  test("works for admin", async () => {
    let resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: "c1",
        title: "NewJob",
        salary: 200,
        equity: "0.3",
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "NewJob",
        salary: 200,
        equity: "0.3",
        companyHandle: "c1",
      },
    });
  });

  test("unauthorized error for users", async () => {
    let resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: "c1",
        title: "NewJob",
        salary: 200,
        equity: "0.3",
      })
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("bad request error for missing data", async () => {
    let resp = await request(app)
      .post(`/jobs`)
      .send({
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

test("bad request error for invalid data", async () => {
  let resp = await request(app)
    .post(`/jobs`)
    .send({
      companyHandle: "c1",
      title: "NewJob",
      salary: "NaN",
      equity: "0.6",
    })
    .set("authorization", `Bearer ${adminToken}`);
  expect(resp.statusCode).toEqual(400);
});

//GET /jobs

describe("GET /jobs", () => {
  test("works for anon", async () => {
    let resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 1000,
          equity: "0.3",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 1000,
          equity: "0.4",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 2000,
          equity: null,
          companyHandle: "c1",
          companyName: "C1",
        },
      ],
    });
  });
  test("works with filtering", async () => {
    let resp = await request(app).get(`/jobs`).query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 1000,
          equity: "0.3",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 1000,
          equity: "0.4",
          companyHandle: "c1",
          companyName: "C1",
        },
      ],
    });
  });
  test("works with multiple filters", async () => {
    let resp = await request(app)
      .get(`/jobs`)
      .query({ minSalary: 999, title: "Job" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 1000,
          equity: "0.3",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 1000,
          equity: "0.4",
          companyHandle: "c1",
          companyName: "C1",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 2000,
          equity: null,
          companyHandle: "c1",
          companyName: "C1",
        }
      ],
    });
  });
  test("bad request error if filter invalid", async () => {
    let resp = await request(app)
      .get(`/jobs`)
      .query({ minSalary: 45, test: "test" });
    expect(resp.statusCode).toEqual(400);
  });
});

//GET /jobs/:id

describe("GET /jobs/:id", () => {
  test("works for anon", async () => {
    let resp = await request(app).get(`/jobs/${testJobIds[0]}`);

    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "Job1",
        salary: 1000,
        equity: "0.3",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });
  test("not found error if job not found", async () => {
    let resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

//PATCH /jobs/:id

describe("PATCH /jobs/:id", () => {
  test("works for admin", async () => {
    let resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({
        title: "Job1Updated",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Job1Updated",
        salary: 1000,
        equity: "0.3",
        companyHandle: "c1",
      },
    });
  });
  test("unathorized error for non-admin", async () => {
    let resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({
        title: "Job1Updated",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  test("not found error if job not found", async () => {
    let resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        handle: "test",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request error if handle being changed", async () => {
    let resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({
        handle: "test",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request error if data not valid", async () => {
    let resp = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({
        salary: "NaN",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

//DELETE /jobs/:id

describe("DELETE /jobs/:id", () => {
  test("works for admin", async () => {
    let resp = await request(app)
      .delete(`/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ Deleted: testJobIds[0] });
  });

  test("unauthorization error for non-admin", async () => {
    let resp = await request(app)
      .delete(`/jobs/${testJobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauthorization error for anon", async () => {
    let resp = await request(app).delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found error if no job found", async () => {
    let resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
