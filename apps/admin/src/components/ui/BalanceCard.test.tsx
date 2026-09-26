/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { BalanceCard } from "./BalanceCard";

describe("BalanceCard (admin)", () => {
  it("renders the formatted available amount", () => {
    render(<BalanceCard label="Wallet" available={12480.5} />);
    expect(screen.getByTestId("balance-amount")).toHaveTextContent("12,480.50");
  });

  it("renders no bar or rows without held", () => {
    render(<BalanceCard label="Wallet" available={10} />);
    expect(screen.queryByTestId("bar-available")).toBeNull();
    expect(screen.queryByText("Available")).toBeNull();
  });

  it("renders a proportional bar and both rows with held", () => {
    render(
      <BalanceCard label="Wallet" available={300} held={{ label: "Held in escrow", amount: 100 }} />
    );
    expect(screen.getByTestId("bar-available").style.flexGrow).toBe("300");
    expect(screen.getByTestId("bar-held").style.flexGrow).toBe("100");
    expect(screen.getByText("Held in escrow")).toBeInTheDocument();
    expect(screen.getByText("GHS 300.00")).toBeInTheDocument();
    expect(screen.getByText("GHS 100.00")).toBeInTheDocument();
  });

  it("renders an empty track when both amounts are zero", () => {
    render(<BalanceCard label="Wallet" available={0} held={{ label: "Held", amount: 0 }} />);
    expect(screen.getByTestId("bar-empty")).toBeInTheDocument();
  });

  it("renders the footnote", () => {
    render(<BalanceCard label="Wallet" available={1} footnote="Lifetime earnings: GHS 9.00" />);
    expect(screen.getByText("Lifetime earnings: GHS 9.00")).toBeInTheDocument();
  });

  it("renders an empty track when available is NaN and nothing is held", () => {
    render(<BalanceCard label="Wallet" available={Number.NaN} held={{ label: "Held", amount: 0 }} />);
    expect(screen.getByTestId("bar-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-available")).toBeNull();
  });
});
