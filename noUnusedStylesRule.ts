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
  private usedProperties: string[] = [];
  public visitVariableDeclaration(node: ts.VariableDeclaration) {
    if (this.isStyleSheetNode(node)) {
      if (node.initializer) {
        node.initializer.forEachChild(child => {
          if (ts.isObjectLiteralExpression(child)) {
            this.stylesheets[node.name.getText()] = child.properties;
          }
        });
      }
    }
    super.visitVariableDeclaration(node);
  }

  public visitPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    if (node.expression.getText() === 'styles') {
      this.usedProperties.push(node.name.getText());
    }

    super.visitPropertyAccessExpression(node);
  }

  public visitEndOfFileToken(node: ts.EndOfFileToken) {
    Object.values(this.stylesheets).forEach(stylesheet => {
      stylesheet.forEach(child => {
        if (child.name) {
          if (!this.usedProperties.includes(child.name.getText())) {
            this.addFailure(
              this.createFailure(child.getStart(), child.getWidth(), Rule.FAILURE_STRING),
            );
          }
        }
      });
    });
    super.visitEndOfFileToken(node);
  }

  private isStyleSheetNode(node: ts.VariableDeclaration) {
    const stylesheet =
      node.initializer &&
      node.initializer.getChildAt(0) &&
      node.initializer.getChildAt(0).getChildAt(0);
    const createCall =
      node.initializer &&
      node.initializer.getChildAt(0) &&
      node.initializer.getChildAt(0).getChildAt(2);
    return (
      stylesheet &&
      stylesheet.getText() === 'StyleSheet' &&
      createCall &&
      createCall.getText() === 'create'
    );
  }
}
