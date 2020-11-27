import { Theme } from "@theme-ui/css";
declare module "@theme-ui/css" {
    export interface Theme {
        colors: {
            background: "white";
            text: "black";
            primary: "#1e7acf";
        };
        space: [
            0,
            4,
            8,
            16
        ];
    }
}
