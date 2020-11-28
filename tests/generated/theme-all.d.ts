declare module "@theme-ui/css" {
    export interface Theme {
        styles: {
            root: {
                fontSize: 1;
            };
        };
        colors: {
            primary: "red";
            secondary: "blue";
            black: "#000";
            dark: {
                primary: "white";
            };
            light: {
                primary: "black";
            };
        };
        space: [
            0,
            4,
            8,
            16
        ];
        borderWidths: [
            0,
            1,
            2
        ];
        layout: {
            spacing: {
                large: {
                    margin: 3;
                };
            };
        };
        buttons: {
            base: {
                p: 3;
                paddingX: [
                    2,
                    3
                ];
                borderWidth: 1;
            };
            primary: {
                backgroundColor: "primary";
            };
        };
    }
}
export {};
