import { render } from "@testing-library/react";
import Home from "@/app/page";

describe('Page', () => {
    test("renders", () => {
        render(<Home />);
    });
});