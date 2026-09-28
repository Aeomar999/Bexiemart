import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { prepareImageForUpload, MAX_IMAGE_DIMENSION } from "./prepare-image";

jest.mock("../logger", () => ({ logger: { error: jest.fn(), info: jest.fn() } }));

const manipulate = ImageManipulator.manipulate as jest.Mock;

function mockImage(width: number, height: number) {
  const saved = { uri: "file:///processed.out", width, height };
  const resized = { width: 0, height: 0, saveAsync: jest.fn(() => Promise.resolve(saved)) };
  const original = { width, height, saveAsync: jest.fn(() => Promise.resolve(saved)) };
  const resizeContext = { resize: jest.fn(), renderAsync: jest.fn(() => Promise.resolve(resized)) };
  resizeContext.resize.mockReturnValue(resizeContext);
  manipulate
    .mockReturnValueOnce({ renderAsync: jest.fn(() => Promise.resolve(original)) })
    .mockReturnValueOnce(resizeContext);
  return { original, resized, resizeContext };
}

describe("prepareImageForUpload", () => {
  beforeEach(() => manipulate.mockReset());

  it("re-encodes an iPhone HEIC photo as JPEG", async () => {
    const { original } = mockImage(1200, 900);
    const result = await prepareImageForUpload({
      uri: "file:///IMG_0001.HEIC",
      name: "IMG_0001.HEIC",
      type: "image/heic",
    });

    expect(original.saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 });
    expect(result).toEqual({
      uri: "file:///processed.out",
      name: "IMG_0001.jpg",
      type: "image/jpeg",
    });
  });

  it("scales a large landscape photo down by width", async () => {
    const { resizeContext, resized } = mockImage(8000, 6000);
    await prepareImageForUpload({ uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" });

    expect(resizeContext.resize).toHaveBeenCalledWith({ width: MAX_IMAGE_DIMENSION });
    expect(resized.saveAsync).toHaveBeenCalled();
  });

  it("scales a large portrait photo down by height", async () => {
    const { resizeContext } = mockImage(3000, 4000);
    await prepareImageForUpload({ uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" });

    expect(resizeContext.resize).toHaveBeenCalledWith({ height: MAX_IMAGE_DIMENSION });
  });

  it("leaves images within the limit at their size", async () => {
    mockImage(1024, 768);
    await prepareImageForUpload({ uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" });
    expect(manipulate).toHaveBeenCalledTimes(1);
  });

  it("keeps PNGs as PNG so logos keep transparency", async () => {
    const { original } = mockImage(512, 512);
    const result = await prepareImageForUpload({
      uri: "file:///logo.png",
      name: "logo.png",
      type: "image/png",
    });

    expect(original.saveAsync).toHaveBeenCalledWith({ format: SaveFormat.PNG });
    expect(result).toMatchObject({ name: "logo.png", type: "image/png" });
  });

  it("falls back to the original file if processing fails", async () => {
    manipulate.mockReturnValueOnce({
      renderAsync: jest.fn(() => Promise.reject(new Error("decode failed"))),
    });
    const file = { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" };
    await expect(prepareImageForUpload(file)).resolves.toBe(file);
  });
});
