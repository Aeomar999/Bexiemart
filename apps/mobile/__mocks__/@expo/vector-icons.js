/**
 * Manual mock for @expo/vector-icons.
 *
 * Renders each icon family as a <Text> with the icon name as content,
 * making it easy to assert in tests (e.g. `getByText("arrow-left")`).
 */
const React = require("react");
const { Text } = require("react-native");

function createIconMock(familyName) {
  const IconComponent = React.forwardRef(
    ({ name, size, color, style, ...rest }, ref) =>
      React.createElement(Text, { ref, style, ...rest }, name)
  );
  IconComponent.displayName = familyName;
  return IconComponent;
}

module.exports = {
  Feather: createIconMock("Feather"),
  FontAwesome: createIconMock("FontAwesome"),
  FontAwesome5: createIconMock("FontAwesome5"),
  FontAwesome6: createIconMock("FontAwesome6"),
  Ionicons: createIconMock("Ionicons"),
  MaterialIcons: createIconMock("MaterialIcons"),
  MaterialCommunityIcons: createIconMock("MaterialCommunityIcons"),
  AntDesign: createIconMock("AntDesign"),
  Entypo: createIconMock("Entypo"),
  EvilIcons: createIconMock("EvilIcons"),
  Foundation: createIconMock("Foundation"),
  Octicons: createIconMock("Octicons"),
  SimpleLineIcons: createIconMock("SimpleLineIcons"),
  Zocial: createIconMock("Zocial"),
  createIconSet: jest.fn(() => createIconMock("CustomIcon")),
  createIconSetFromFontello: jest.fn(() => createIconMock("FontelloIcon")),
  createIconSetFromIcoMoon: jest.fn(() => createIconMock("IcoMoonIcon")),
};
