---
date: 2026-08-16
lastmod: 2026-08-17
title: 利用Quicker一键切换电源模式
---

## Powershell

{{< details summary="📂 点击展开完整 PowerShell 脚本" >}}
```

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore

$powerCfg = "$env:SystemRoot\System32\powercfg.exe"
$guidRegex = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

# 获取当前电源计划
$activeText = & $powerCfg /getactivescheme 2>$null | Out-String

if ($activeText -match $guidRegex) {
    $activeGuid = $matches[0].ToLower()
}
else {
    [System.Windows.MessageBox]::Show("无法获取当前电源计划。")
    exit
}

# 获取全部电源计划
$plans = @()

foreach ($line in (& $powerCfg /list 2>$null)) {

    if ($line -match "($guidRegex)\s+\(([^)]*)\)") {

        $guid = $matches[1].ToLower()
        $name = $matches[2].Trim()

        $plans += [PSCustomObject]@{
            Name     = $name
            Guid     = $guid
            IsActive = ($guid -eq $activeGuid)
        }
    }
}

if ($plans.Count -eq 0) {
    [System.Windows.MessageBox]::Show("没有检测到电源计划。")
    exit
}

$currentPlan = $plans |
    Where-Object { $_.IsActive } |
    Select-Object -First 1

$currentName = if ($currentPlan) {
    $currentPlan.Name
}
else {
    "未知"
}

# ===============================
# 界面
# ===============================

$xaml = @"
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="电源计划"
    Width="400"
    SizeToContent="Height"
    MaxHeight="600"
    WindowStartupLocation="CenterScreen"
    WindowStyle="None"
    ResizeMode="NoResize"
    AllowsTransparency="True"
    Background="Transparent"
    ShowInTaskbar="False"
    Topmost="True">

    <Window.Resources>

        <Style x:Key="PlanButton" TargetType="Button">

            <Setter Property="Background" Value="#FFFFFF"/>
            <Setter Property="BorderBrush" Value="#E5E7EB"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Cursor" Value="Hand"/>
            <Setter Property="HorizontalContentAlignment" Value="Stretch"/>

            <Setter Property="Template">

                <Setter.Value>

                    <ControlTemplate TargetType="Button">

                        <Border
                            x:Name="Border"
                            Background="{TemplateBinding Background}"
                            BorderBrush="{TemplateBinding BorderBrush}"
                            BorderThickness="{TemplateBinding BorderThickness}"
                            CornerRadius="10">

                            <ContentPresenter
                                HorizontalAlignment="Stretch"
                                VerticalAlignment="Center"/>

                        </Border>

                        <ControlTemplate.Triggers>

                            <Trigger Property="IsMouseOver" Value="True">

                                <Setter
                                    TargetName="Border"
                                    Property="Background"
                                    Value="#F3F7FF"/>

                                <Setter
                                    TargetName="Border"
                                    Property="BorderBrush"
                                    Value="#8CB4FF"/>

                            </Trigger>

                        </ControlTemplate.Triggers>

                    </ControlTemplate>

                </Setter.Value>

            </Setter>

        </Style>

    </Window.Resources>

    <Border
        Margin="18"
        Padding="21"
        Background="#FAFAFA"
        BorderBrush="#E5E7EB"
        BorderThickness="1"
        CornerRadius="16">

        <Border.Effect>
            <DropShadowEffect
                BlurRadius="22"
                ShadowDepth="4"
                Opacity="0.22"/>
        </Border.Effect>

        <Grid>

            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>

            <!-- 标题 -->
            <Grid Grid.Row="0">

                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>

                <StackPanel>

                    <TextBlock
                        Text="电源计划"
                        FontFamily="Microsoft YaHei UI"
                        FontSize="19"
                        FontWeight="SemiBold"
                        Foreground="#111827"/>

                    <TextBlock
                        Name="CurrentText"
                        Margin="0,5,0,0"
                        FontFamily="Microsoft YaHei UI"
                        FontSize="12"
                        Foreground="#6B7280"/>

                </StackPanel>

                <Button
                    Name="CloseButton"
                    Grid.Column="1"
                    Width="32"
                    Height="32"
                    Background="Transparent"
                    BorderThickness="0"
                    Cursor="Hand">

                    <TextBlock
                        Text="×"
                        FontSize="22"
                        Foreground="#6B7280"/>

                </Button>

            </Grid>

            <!-- 分割线 -->
            <Border
                Grid.Row="1"
                Height="1"
                Margin="0,17,0,15"
                Background="#E5E7EB"/>

            <!-- 电源计划 -->
            <ScrollViewer
                Grid.Row="2"
                MaxHeight="390"
                VerticalScrollBarVisibility="Auto"
                HorizontalScrollBarVisibility="Disabled">

                <StackPanel Name="PlanPanel"/>

            </ScrollViewer>

            <!-- 底部 -->
            <Grid Grid.Row="3" Margin="2,10,2,0">

                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>

                <TextBlock
                    Text="点击计划立即切换"
                    FontFamily="Microsoft YaHei UI"
                    FontSize="11"
                    Foreground="#9CA3AF"/>

                <TextBlock
                    Grid.Column="1"
                    Text="Esc 关闭"
                    FontFamily="Microsoft YaHei UI"
                    FontSize="11"
                    Foreground="#9CA3AF"/>

            </Grid>

        </Grid>

    </Border>

</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)

$panel = $window.FindName("PlanPanel")
$currentText = $window.FindName("CurrentText")
$closeButton = $window.FindName("CloseButton")

$currentText.Text = "当前：$currentName"

# ===============================
# 创建计划按钮
# ===============================

foreach ($plan in $plans) {

    $button = New-Object System.Windows.Controls.Button

    $button.Height = 57
    $button.Margin = "0,0,0,8"
    $button.Padding = "14,0"
    $button.Tag = $plan.Guid
    $button.Style = $window.Resources["PlanButton"]

    if ($plan.IsActive) {
        $button.Background = "#EEF5FF"
        $button.BorderBrush = "#4D8EFF"
        $button.BorderThickness = "1.5"
    }

    $grid = New-Object System.Windows.Controls.Grid

    $c1 = New-Object System.Windows.Controls.ColumnDefinition
    $c1.Width = "Auto"

    $c2 = New-Object System.Windows.Controls.ColumnDefinition
    $c2.Width = "*"

    $c3 = New-Object System.Windows.Controls.ColumnDefinition
    $c3.Width = "Auto"

    [void]$grid.ColumnDefinitions.Add($c1)
    [void]$grid.ColumnDefinitions.Add($c2)
    [void]$grid.ColumnDefinitions.Add($c3)

    # 圆点
    $dot = New-Object System.Windows.Shapes.Ellipse
    $dot.Width = 10
    $dot.Height = 10
    $dot.Margin = "0,0,13,0"

    if ($plan.IsActive) {
        $dot.Fill = "#3478F6"
    }
    else {
        $dot.Fill = "#D1D5DB"
    }

    [System.Windows.Controls.Grid]::SetColumn($dot, 0)
    [void]$grid.Children.Add($dot)

    # 名称
    $name = New-Object System.Windows.Controls.TextBlock
    $name.Text = $plan.Name
    $name.FontFamily = "Microsoft YaHei UI"
    $name.FontSize = 14
    $name.VerticalAlignment = "Center"

    if ($plan.IsActive) {
        $name.Foreground = "#1D4ED8"
        $name.FontWeight = "SemiBold"
    }
    else {
        $name.Foreground = "#1F2937"
    }

    [System.Windows.Controls.Grid]::SetColumn($name, 1)
    [void]$grid.Children.Add($name)

    # 右侧状态
    $right = New-Object System.Windows.Controls.TextBlock

    if ($plan.IsActive) {
        $right.Text = "当前"
        $right.Foreground = "#2563EB"
        $right.FontSize = 11
    }
    else {
        $right.Text = ">"
        $right.Foreground = "#9CA3AF"
        $right.FontSize = 15
    }

    $right.VerticalAlignment = "Center"
    $right.Margin = "10,0,3,0"

    [System.Windows.Controls.Grid]::SetColumn($right, 2)
    [void]$grid.Children.Add($right)

    $button.Content = $grid

    # 点击切换
    $button.Add_Click({

        param($sender, $eventArgs)

        $guid = [string]$sender.Tag

        # 点击当前计划直接关闭
        if ($guid -eq $activeGuid) {
            $window.Close()
            return
        }

        & $powerCfg /setactive $guid 2>$null | Out-Null

        if ($LASTEXITCODE -eq 0) {

            $window.Close()

        }
        else {

            [System.Windows.MessageBox]::Show(
                "切换电源计划失败。",
                "电源计划",
                [System.Windows.MessageBoxButton]::OK,
                [System.Windows.MessageBoxImage]::Error
            ) | Out-Null
        }

    })

    [void]$panel.Children.Add($button)
}

# × 关闭
$closeButton.Add_Click({
    $window.Close()
})

# Esc 关闭
$window.Add_PreviewKeyDown({

    param($sender, $eventArgs)

    if ($eventArgs.Key -eq [System.Windows.Input.Key]::Escape) {
        $window.Close()
    }

})

[void]$window.ShowDialog()
```

{{< /details >}}

导入到Quicker即可