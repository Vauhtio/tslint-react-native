import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
  public static FAILURE_STRING = 'This style is not used';

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new NoUnusedStylesWalker(sourceFile, this.getOptions()));
  }
}

class NoUnusedStylesWalker extends Lint.RuleWalker {
  private stylesheets: Record<string, ts.NodeArray<ts.ObjectLiteralElementLike>> = {};
  private usedProperties: Record<string, string[]> = {};
  public visitVariableDeclaration(node: ts.VariableDeclaration) {
    if (node.initializer && this.isStyleSheetNode(node.initializer)) {
      node.initializer.forEachChild(child => {
        if (ts.isObjectLiteralExpression(child)) {
          this.stylesheets[node.name.getText()] = child.properties;
        }
      });
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
      stylesheet.forEach(child => {
        if (child.name) {
          if (!this.usedProperties[variableName].includes(child.name.getText())) {
            this.addFailure(
              this.createFailure(child.getStart(), child.getWidth(), Rule.FAILURE_STRING)
            );
          }
        }
      });
    });
    super.visitEndOfFileToken(node);
  }

  private isStyleSheetNode(initializer: ts.Expression) {
    return (
      ts.isCallExpression(initializer) &&
      initializer.expression &&
      ts.isPropertyAccessExpression(initializer.expression) &&
      initializer.expression.expression.getText() === 'StyleSheet' &&
      initializer.expression.name.getText() === 'create'
    );
  }
}
