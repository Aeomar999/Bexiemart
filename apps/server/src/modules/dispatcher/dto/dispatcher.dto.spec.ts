import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { UpdateDispatcherProfileDto } from "./dispatcher.dto";

const errorsFor = async (body: object) =>
  (await validate(plainToInstance(UpdateDispatcherProfileDto, body))).map((e) => e.property);

describe("UpdateDispatcherProfileDto", () => {
  it("accepts a known vehicle type and a plate", async () => {
    expect(await errorsFor({ vehicleType: "van", plateNumber: "AS-1234-21" })).toEqual([]);
  });

  it("accepts either field on its own", async () => {
    expect(await errorsFor({ vehicleType: "bike" })).toEqual([]);
    expect(await errorsFor({ plateNumber: "gr 55 24" })).toEqual([]);
  });

  it("rejects an unknown vehicle type", async () => {
    expect(await errorsFor({ vehicleType: "helicopter" })).toEqual(["vehicleType"]);
  });

  it.each(["", "  ", "A", "AS-1234-21<script>", "-AS-12", "X".repeat(21)])(
    "rejects plate %p",
    async (plateNumber) => {
      expect(await errorsFor({ plateNumber })).toEqual(["plateNumber"]);
    }
  );
});
