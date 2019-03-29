import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
  public static FAILURE_STRING = 'This style is not used';

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new NoUnusedStylesWalker(sourceFile, this.getOptions()));
  }
}

class NoUnusedStylesWalker extends Lint.RuleWalker {
  private stylesheets: Record<string, ts.NodeArray<ts.ObjectLiteralElement>> = {};
  private usedProperties: Record<string, string[]> = {};

  public visitVariableDeclaration(node: ts.VariableDeclaration) {
    const { name, initializer } = node;
    if (initializer && this.isStyleSheetInitializer(initializer)) {
      const firstArgument = initializer.arguments[0];
      if (firstArgument && ts.isObjectLiteralExpression(firstArgument)) {
        this.stylesheets[name.getText()] = firstArgument.properties;
      }
    }
    super.visitVariableDeclaration(node);
  }

  public visitPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    if (!this.usedProperties[node.expression.getText()]) {
      this.usedProperties[node.expression.getText()] = [];
    }
    this.usedProperties[node.expression.getText()].push(node.name.getText());

    super.visitPropertyAccessExpression(node);
  }

  public visitEndOfFileToken(node: ts.EndOfFileToken) {
    Object.entries(this.stylesheets).forEach(([variableName, stylesheet]) => {
      const usedPropsForStyleSheet = this.usedProperties[variableName];
      stylesheet.forEach(child => {
        if (
          ts.isPropertyAssignment(child) &&
          (!usedPropsForStyleSheet || !usedPropsForStyleSheet.includes(child.name.getText()))
        ) {
          this.addFailure(
            this.createFailure(child.getStart(), child.getWidth(), Rule.FAILURE_STRING),
          );
        }
      });
    });
    super.visitEndOfFileToken(node);
  }

  private isStyleSheetInitializer(initializer: ts.Expression): initializer is ts.CallExpression {
    return (
      ts.isCallExpression(initializer) &&
      initializer.expression &&
      ts.isPropertyAccessExpression(initializer.expression) &&
      initializer.expression.expression.getText() === 'StyleSheet' &&
      initializer.expression.name.getText() === 'create'
    );
  }
}
