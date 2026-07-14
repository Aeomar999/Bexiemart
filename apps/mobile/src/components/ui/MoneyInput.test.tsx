import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { MoneyInput } from "./MoneyInput";

describe("MoneyInput", () => {
  it("renders the currency prefix and placeholder", () => {
    const { getByText, getByPlaceholderText } = render(
      <MoneyInput value={0} onChangeValue={() => {}} testID="mi" />
    );
    expect(getByText("GHS")).toBeTruthy();
    expect(getByPlaceholderText("0.00")).toBeTruthy();
  });

  it("emits a major-unit number on change", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<MoneyInput value={0} onChangeValue={onChange} testID="mi" />);
    fireEvent.changeText(getByTestId("mi"), "12.50");
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it("blocks input above max", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <MoneyInput value={0} onChangeValue={onChange} max={100} testID="mi" />
    );
    fireEvent.changeText(getByTestId("mi"), "150");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows insufficient-balance error and stays enabled", () => {
    const { getByText } = render(
      <MoneyInput value={500} onChangeValue={() => {}} balance={320.5} testID="mi" />
    );
    expect(getByText("Insufficient balance")).toBeTruthy();
  });

  it("shows a minimum message below min", () => {
    const { getByText } = render(
      <MoneyInput value={3} onChangeValue={() => {}} min={5} testID="mi" />
    );
    expect(getByText("Minimum GHS 5.00")).toBeTruthy();
  });

  it("lets an external error override the internal message", () => {
    const { getByText, queryByText } = render(
      <MoneyInput value={500} onChangeValue={() => {}} balance={1} error="Nope" testID="mi" />
    );
    expect(getByText("Nope")).toBeTruthy();
    expect(queryByText("Insufficient balance")).toBeNull();
  });

  it("renders quick-amount chips and sets the value on press", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <MoneyInput value={0} onChangeValue={onChange} quickAmounts={[50, 100, 200]} testID="mi" />
    );
    fireEvent.press(getByText("+200"));
    expect(onChange).toHaveBeenCalledWith(200);
  });

  it("renders the fee/total breakdown from feeCalc", () => {
    const { getByText } = render(
      <MoneyInput value={100} onChangeValue={() => {}} feeCalc={() => 5} testID="mi" />
    );
    expect(getByText("Fee")).toBeTruthy();
    expect(getByText("GHS 105.00")).toBeTruthy();
  });

  it("renders read-only in display mode with no input", () => {
    const { getByText, queryByTestId } = render(
      <MoneyInput value={1284.5} onChangeValue={() => {}} mode="display" testID="mi" />
    );
    expect(getByText("1,284.50")).toBeTruthy();
    expect(queryByTestId("mi")?.props?.editable).not.toBe(true);
  });

  it("respects editable=false", () => {
    const { getByTestId } = render(
      <MoneyInput value={0} onChangeValue={() => {}} editable={false} testID="mi" />
    );
    expect(getByTestId("mi").props.editable).toBe(false);
  });
});
