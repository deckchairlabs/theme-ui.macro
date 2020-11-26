import { Theme } from "@theme-ui/css";
declare module "@theme-ui/css" {
    export interface Theme {
        useCustomProperties: {};
        colors: {
            background: "white";
            text: "black";
            primary: "red";
        };
        space: [
            0,
            4,
            8,
            16
        ];
    }
}
