import { Hono } from "hono";
const natiTest = new Hono();

natiTest.get("/", async (c) => {
  try {
    let result = {
        name: "suck my butt"
      };
  
      return c.json(result);
  } catch (error) {
    c.status(500);
    return c.json({
      message: error.message,
    });
  }
});

export default natiTest;
